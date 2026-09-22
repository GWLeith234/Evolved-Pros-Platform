/**
 * POST /api/stripe/webhook — LIVE MODE (header corrected in SPRINT K).
 *
 * Stripe → OUR tables. Verifies the signature, then maps subscription events
 * onto users.tier / tier_status / tier_expires_at and writes a tier_change_log
 * row on any actual tier change. Mirrors the tier semantics the legacy
 * Vendasta webhook established (cancellation preserves tier until expiry).
 *
 * Events handled:
 *   checkout.session.completed     → activate the purchased tier
 *   customer.subscription.updated  → re-sync tier / expiry / status
 *   customer.subscription.deleted  → mark cancelled, keep tier until expiry
 *
 * Idempotency: tier/expiry updates are absolute (safe to replay). The
 * tier_change_log insert is guarded to only fire when the tier actually
 * changes, so replays don't duplicate audit rows in the common case. A
 * dedicated stripe_event log table is a Phase-1 follow-up if strict de-dup
 * of same-tier replays is needed.
 */

export const dynamic = 'force-dynamic'

import type Stripe from 'stripe'
import { adminClient } from '@/lib/supabase/admin'
import { getStripe, tierForPriceId, type Tier } from '@/lib/stripe/config'
import { tierForStripePriceId } from '@/lib/commerce/catalogue'
import { joinSeatWaitlist, seatStatusForTier } from '@/lib/commerce/seats'
import { shouldApplySubscriptionUpdate, shouldDowngradeOnDelete } from '@/lib/stripe/subscriptionSync'
import {
  bestEffortConversion,
  notifyPaidAdmins,
  upsertPaidProspect,
} from '@/lib/crm/conversion'
import { supabaseIntakeDb } from '@/lib/crm/intakeDb'

type UserRow = {
  id: string
  tier: string | null
  email?: string | null
  full_name?: string | null
  stripe_subscription_id?: string | null
  stripe_customer_id?: string | null
  comp_promo_code_id?: string | null
}

// --- helpers --------------------------------------------------------------

function tsToIso(seconds: number | null | undefined): string | null {
  return typeof seconds === 'number' ? new Date(seconds * 1000).toISOString() : null
}

async function logTierChange(
  userId: string,
  oldTier: string | null,
  newTier: Tier,
  direction: string,
): Promise<void> {
  if (oldTier === newTier) return
  const { error } = await (adminClient as any).from('tier_change_log').insert({
    user_id: userId,
    old_tier: oldTier,
    new_tier: newTier,
    direction,
  })
  if (error) console.error('[Stripe Webhook] tier_change_log insert failed:', error.message)
}

// Resolve our user row by stripe_subscription_id first, then stripe_customer_id.
async function findUserByIds(
  subscriptionId: string | null,
  customerId: string | null,
): Promise<UserRow | null> {
  if (subscriptionId) {
    const bySub = await (adminClient as any)
      .from('users')
      .select('id, tier, stripe_subscription_id, stripe_customer_id, comp_promo_code_id')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle()
    if (bySub.data) return bySub.data as UserRow
  }
  if (customerId) {
    const byCustomer = await (adminClient as any)
      .from('users')
      .select('id, tier, stripe_subscription_id, stripe_customer_id, comp_promo_code_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    if (byCustomer.data) return byCustomer.data as UserRow
  }
  return null
}

function subCustomerId(sub: Stripe.Subscription): string | null {
  return typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null
}

function findUserBySubscription(sub: Stripe.Subscription): Promise<UserRow | null> {
  return findUserByIds(sub.id, subCustomerId(sub))
}

// Catalogue (prices.stripe_price_id → product.tier) is the source of truth;
// env config is the fallback until every price is mirrored to Stripe.
async function tierFromSubscription(sub: Stripe.Subscription): Promise<Tier | null> {
  const priceId = sub.items?.data?.[0]?.price?.id
  if (!priceId) return null
  return (await tierForStripePriceId(priceId)) ?? tierForPriceId(priceId)
}

function currentPeriodEndIso(sub: Stripe.Subscription): string | null {
  // current_period_end is a top-level Unix ts on the subscription; cast keeps
  // us resilient to Stripe API-version type drift.
  return tsToIso((sub as unknown as { current_period_end?: number }).current_period_end)
}

/**
 * True when this subscription pushed a capped product past its cap.
 *
 * FAILS OPEN, unlike the checkout guard, and deliberately: the member has
 * already paid. Cancelling a real subscription because Stripe was briefly
 * unreachable takes money and access from somebody who did nothing wrong.
 * Over-seating by one is recoverable by hand; a wrongful cancellation is not.
 */
async function seatOverflow(tier: Tier, subscriptionId: string): Promise<boolean> {
  if (tier === 'community') return false
  const seats = await seatStatusForTier(tier)
  if (!seats.known || seats.cap === null) return false
  const over = seats.taken > seats.cap
  if (over) {
    console.warn(
      `[Stripe Webhook] seat cap exceeded: tier=${tier} taken=${seats.taken} cap=${seats.cap} sub=${subscriptionId}`,
    )
  }
  return over
}

/**
 * Undo an overflow purchase: cancel the subscription, refund what was charged,
 * and record the buyer at the front of the waitlist. The member is NOT granted
 * the tier - handleCheckoutCompleted returns before its users update.
 */
async function handleSeatOverflow(opts: {
  tier: Tier
  subscriptionId: string
  userId: string
  session: Stripe.Checkout.Session
}): Promise<void> {
  const stripe = getStripe()
  try {
    await stripe.subscriptions.cancel(opts.subscriptionId, {
      prorate: false,
      invoice_now: false,
    })
  } catch (err) {
    const code = (err as { code?: string }).code ?? 'unknown'
    console.error('[Stripe Webhook] overflow cancel failed', code)
  }

  // Refund the invoice this checkout paid. Best effort: a failed refund must
  // not prevent the waitlist row, and an unrefunded charge is visible in
  // Stripe where a human can finish it.
  try {
    const invoiceId =
      typeof (opts.session as { invoice?: unknown }).invoice === 'string'
        ? (opts.session as { invoice: string }).invoice
        : null
    if (invoiceId) {
      const invoice = await stripe.invoices.retrieve(invoiceId)
      const paymentIntent = (invoice as unknown as { payment_intent?: unknown }).payment_intent
      if (typeof paymentIntent === 'string') {
        await stripe.refunds.create({ payment_intent: paymentIntent })
      }
    }
  } catch (err) {
    const code = (err as { code?: string }).code ?? 'unknown'
    console.error('[Stripe Webhook] overflow refund failed', code)
  }

  const existing = await (adminClient as any)
    .from('users')
    .select('id, email, full_name, tier, stripe_subscription_id, stripe_customer_id, comp_promo_code_id')
    .eq('id', opts.userId)
    .maybeSingle()
  const row = existing.data as UserRow | null
  await releaseOverflowGrant(row, opts.subscriptionId)
  const email = (row?.email || opts.session.customer_details?.email || '').trim().toLowerCase()
  if (email && opts.tier !== 'community') {
    await joinSeatWaitlist({
      tier: opts.tier,
      userId: opts.userId,
      email,
      fullName: row?.full_name ?? null,
      source: 'webhook',
      notes: `Overflow on ${opts.subscriptionId}; subscription cancelled and refunded.`,
    })
  }
}

// --- event handlers -------------------------------------------------------

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId =
    session.client_reference_id ??
    (session.metadata?.user_id as string | undefined) ??
    null
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null
  const customerId = typeof session.customer === 'string' ? session.customer : null

  if (!userId || !subscriptionId) {
    console.warn('[Stripe Webhook] checkout.session.completed missing user/subscription', {
      hasUser: !!userId,
      hasSub: !!subscriptionId,
    })
    return
  }

  // Retrieve the subscription so tier comes from the real price, not just
  // the (client-supplied) session metadata.
  const sub = await getStripe().subscriptions.retrieve(subscriptionId)
  const tier = (await tierFromSubscription(sub)) ?? (session.metadata?.tier as Tier | undefined) ?? null
  if (!tier) {
    console.error('[Stripe Webhook] could not resolve tier for subscription', subscriptionId)
    return
  }

  // SPRINT L - SEAT CAP RECONCILIATION.
  //
  // The checkout guard reads the seat count before creating a session, which
  // cannot stop two people buying seat 99 at the same time: both read 98 taken,
  // both are let through, both pay. Stripe is the only place that knows how
  // many subscriptions actually exist, so this is where the truth is settled.
  //
  // The count INCLUDES the subscription this event is about, so a legitimate
  // final seat reads exactly at the cap. Over the cap means this purchase is
  // the overflow: cancel it, refund it, and put the buyer at the front of the
  // waitlist rather than seating 100 people in a room that sells 99.
  if (await seatOverflow(tier, subscriptionId)) {
    await handleSeatOverflow({ tier, subscriptionId, userId, session })
    return
  }

  const existing = await (adminClient as any)
    .from('users')
    .select('id, tier, email, full_name')
    .eq('id', userId)
    .maybeSingle()
  const existingUser = existing.data as UserRow | null
  const oldTier = existingUser?.tier ?? null

  const { error } = await (adminClient as any)
    .from('users')
    .update({
      tier,
      tier_status: 'active',
      tier_expires_at: currentPeriodEndIso(sub),
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    })
    .eq('id', userId)
  if (error) throw new Error(`users update (checkout) failed: ${error.message}`)

  await logTierChange(userId, oldTier, tier, 'stripe_checkout')

  const email = (
    existingUser?.email ||
    session.customer_details?.email ||
    (session as { customer_email?: string | null }).customer_email ||
    ''
  )
    .trim()
    .toLowerCase()
  if (email) {
    const paidWrite = {
      email,
      full_name: existingUser?.full_name ?? null,
      user_id: userId,
      tier,
    }
    await bestEffortConversion(
      'Stripe Webhook checkout.session.completed',
      () => upsertPaidProspect(supabaseIntakeDb, paidWrite),
      () => notifyPaidAdmins(supabaseIntakeDb, paidWrite),
    )
  }
}

/**
 * If subscription.updated adopted the overflow subscription before this cancel
 * landed, put the member back on their other live subscription, or onto
 * community when this was their only one. A comp keeps the grant: clear the
 * subscription id and leave the tier.
 */
async function releaseOverflowGrant(row: UserRow | null, cancelledSubId: string): Promise<void> {
  if (!row || row.stripe_subscription_id !== cancelledSubId) return
  if (row.comp_promo_code_id) {
    const { error } = await (adminClient as any)
      .from('users')
      .update({ stripe_subscription_id: null })
      .eq('id', row.id)
    if (error) console.error('[Stripe Webhook] overflow comp detach failed', error.code ?? 'unknown')
    return
  }

  const customerId = row.stripe_customer_id
  if (customerId) {
    try {
      const subs = await getStripe().subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 20,
      })
      const live = subs.data.find(
        s => s.id !== cancelledSubId && (s.status === 'active' || s.status === 'trialing'),
      )
      if (live) {
        const tier = await tierFromSubscription(live)
        if (tier) {
          const { error } = await (adminClient as any)
            .from('users')
            .update({
              tier,
              tier_status: 'active',
              tier_expires_at: currentPeriodEndIso(live),
              stripe_subscription_id: live.id,
            })
            .eq('id', row.id)
          if (error) console.error('[Stripe Webhook] overflow restore failed', error.code ?? 'unknown')
          return
        }
      }
    } catch (err) {
      const code = (err as { code?: string }).code ?? 'unknown'
      console.error('[Stripe Webhook] overflow restore lookup failed', code)
      // Leave the row. Failing open beats downgrading a member we could not check.
      return
    }
  }

  const { error } = await (adminClient as any)
    .from('users')
    .update({
      tier: 'community',
      tier_status: 'cancelled',
      tier_expires_at: null,
      stripe_subscription_id: null,
    })
    .eq('id', row.id)
  if (error) console.error('[Stripe Webhook] overflow downgrade failed', error.code ?? 'unknown')
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription): Promise<void> {
  const user = await findUserBySubscription(sub)
  if (!user) {
    console.warn('[Stripe Webhook] subscription.updated for unknown user', sub.id)
    return
  }
  const tier = await tierFromSubscription(sub)
  if (!tier) {
    console.warn('[Stripe Webhook] subscription.updated with unmapped price', sub.id)
    return
  }

  const action = shouldApplySubscriptionUpdate({
    storedSubscriptionId: user.stripe_subscription_id,
    eventSubscriptionId: sub.id,
    eventStatus: sub.status,
    storedTier: user.tier,
  })
  if (action === 'ignore') return
  // Adopting seat 100 would grant the room the checkout race just overflowed.
  if (action === 'adopt' && await seatOverflow(tier, sub.id)) return

  // active/trialing → active; a scheduled cancel keeps the tier but flags
  // cancelled; anything else (past_due, unpaid, incomplete) → past_due.
  const status =
    sub.cancel_at_period_end ? 'cancelled'
    : sub.status === 'active' || sub.status === 'trialing' ? 'active'
    : 'past_due'

  const { error } = await (adminClient as any)
    .from('users')
    .update({
      tier,
      tier_status: status,
      tier_expires_at: currentPeriodEndIso(sub),
      stripe_subscription_id: sub.id,
    })
    .eq('id', user.id)
  if (error) throw new Error(`users update (sub.updated) failed: ${error.message}`)

  await logTierChange(user.id, user.tier, tier, 'stripe_subscription_updated')
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  // Subscription id only. Customer fallback downgraded whoever shared the
  // Stripe customer when an overflow cancel — or any other extra subscription —
  // was deleted.
  const user = await findUserByIds(sub.id, null)
  if (!user || !shouldDowngradeOnDelete({
    storedSubscriptionId: user.stripe_subscription_id,
    eventSubscriptionId: sub.id,
  })) {
    return
  }
  // Subscription has fully ended → downgrade to the free Community tier and
  // detach the subscription id (per the Stripe integration plan).
  const { error } = await (adminClient as any)
    .from('users')
    .update({
      tier: 'community',
      tier_status: 'cancelled',
      tier_expires_at: null,
      stripe_subscription_id: null,
    })
    .eq('id', user.id)
  if (error) throw new Error(`users update (sub.deleted) failed: ${error.message}`)

  await logTierChange(user.id, user.tier, 'community', 'stripe_subscription_deleted')
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId =
    typeof (invoice as unknown as { subscription?: unknown }).subscription === 'string'
      ? ((invoice as unknown as { subscription: string }).subscription)
      : null
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
  const user = await findUserByIds(subscriptionId, customerId)
  if (!user) {
    console.warn('[Stripe Webhook] invoice.payment_failed for unknown user', invoice.id)
    return
  }
  // Grace: flag past_due but keep the tier (access) until Stripe finally
  // cancels the subscription (→ subscription.deleted downgrades to community).
  const { error } = await (adminClient as any)
    .from('users')
    .update({ tier_status: 'past_due' })
    .eq('id', user.id)
  if (error) throw new Error(`users update (invoice.payment_failed) failed: ${error.message}`)
  // NOTE: member notification email for past_due is a follow-up (needs a
  // dedicated Resend template); logging for now.
  console.info('[Stripe Webhook] tier_status → past_due for user', user.id)
}

// --- entrypoint -----------------------------------------------------------

export async function POST(request: Request) {
  const sigHeader = request.headers.get('stripe-signature')
  // FIX 1 (hardening, not root cause): dashboard copy-paste of the signing
  // secret routinely appends a trailing newline; trim it so a structurally
  // valid-but-whitespace-padded secret still verifies.
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim()

  // Presence/length flags for diagnostics. SECURITY: we log the LENGTH of the
  // secret and boolean presence only — never the secret, any fragment of it,
  // the signature header value, or the request body.
  const secretPresent = Boolean(secret)
  const secretLen = secret ? secret.length : 0
  const sigHeaderPresent = Boolean(sigHeader)

  // Single exit for verification failures: log one diagnosable line and return
  // a short, non-sensitive machine-readable reason code. Defaults to HTTP 400
  // (a bad request), except missing_secret_env, which is a server
  // misconfiguration and returns 500 (see the caller below).
  const fail = (reason: string, status = 400) => {
    console.warn(
      `[Stripe Webhook] verification failed: reason=${reason} ` +
        `secret_present=${secretPresent} secret_len=${secretLen} ` +
        `sig_header_present=${sigHeaderPresent}`,
    )
    return Response.json(
      { error: 'webhook_verification_failed', reason },
      { status },
    )
  }

  if (!sigHeader) return fail('missing_signature_header')
  // Server misconfiguration, not a bad request → 500 (the other four reasons
  // stay 400). Reason body and log line are unchanged.
  if (!secret) return fail('missing_secret_env', 500)

  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return fail('body_read_error')
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sigHeader, secret)
  } catch (err) {
    // Stripe throws StripeSignatureVerificationError for BOTH a stale timestamp
    // and a non-matching signature. The SDK exposes no discriminating field, so
    // the only clean signal is its own error message. The SDK checks signature
    // presence *before* the timestamp tolerance, so a "timestamp" message means
    // the signature actually matched — hence the distinction is trustworthy.
    // Any unrecognised verification error falls back to signature_mismatch.
    const msg = err instanceof Error ? err.message : ''
    const reason = /timestamp outside the tolerance zone/i.test(msg)
      ? 'timestamp_out_of_tolerance'
      : 'signature_mismatch'
    return fail(reason)
  }

  // Idempotency: skip events we've already applied (Stripe retries deliveries).
  const seen = await (adminClient as any)
    .from('billing_events')
    .select('stripe_event_id')
    .eq('stripe_event_id', event.id)
    .maybeSingle()
  if (seen.data) {
    return Response.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'handler error'
    console.error('[Stripe Webhook]', event.type, msg)
    // 5xx so Stripe retries — our updates are replay-safe. Not recorded in
    // billing_events, so the retry reprocesses.
    return Response.json({ error: msg }, { status: 500 })
  }

  // Record the applied event so retries are deduped. ignoreDuplicates guards
  // the rare concurrent-delivery race.
  await (adminClient as any)
    .from('billing_events')
    .upsert({ stripe_event_id: event.id, type: event.type }, {
      onConflict: 'stripe_event_id',
      ignoreDuplicates: true,
    })

  return Response.json({ received: true })
}
