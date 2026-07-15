/**
 * POST /api/stripe/webhook — SPRINT I Phase 1 (Stripe, TEST MODE)
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

type UserRow = { id: string; tier: string | null }

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
      .select('id, tier')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle()
    if (bySub.data) return bySub.data as UserRow
  }
  if (customerId) {
    const byCustomer = await (adminClient as any)
      .from('users')
      .select('id, tier')
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

  const existing = await (adminClient as any)
    .from('users')
    .select('id, tier')
    .eq('id', userId)
    .maybeSingle()
  const oldTier = (existing.data as UserRow | null)?.tier ?? null

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
  const user = await findUserBySubscription(sub)
  if (!user) {
    console.warn('[Stripe Webhook] subscription.deleted for unknown user', sub.id)
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
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set')
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const sig = request.headers.get('stripe-signature')
  if (!sig) return Response.json({ error: 'Missing signature' }, { status: 400 })

  const rawBody = await request.text()
  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'verify error'
    console.warn('[Stripe Webhook] signature verification failed:', msg)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
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
