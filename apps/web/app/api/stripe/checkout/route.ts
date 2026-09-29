/**
 * POST /api/stripe/checkout — LIVE MODE.
 *
 * Server-side Stripe Checkout Session flow for the Community → VIP → The 99
 * upgrade. Hosted Checkout (no card data touches us).
 *
 * SPRINT K — this file used to be headed "SPRINT I Phase 1 (Stripe, TEST
 * MODE)". It has been running against sk_live_ since at least 2026-09-11:
 * four cs_live_ sessions exist carrying this route's own metadata shape. The
 * banner was stale, and a stale "TEST MODE" banner on a route that takes real
 * money is the kind of comment that gets someone to test a theory in
 * production. PricingCtaButton posts here unconditionally; there is no
 * NEXT_PUBLIC_PAYMENTS_PROVIDER branch any more.
 *
 * Body:  { plan: 'vip_monthly' | 'vip_annual' | 'pro_monthly' | 'pro_annual' }
 * Reply: { url }        — Stripe-hosted checkout URL (redirect target)
 *        { error }      — on any failure
 */

export const dynamic = 'force-dynamic'

import type Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { getStripe, isPlanKey, priceIdForPlan, PLAN_CATALOG, stripeConfigured } from '@/lib/stripe/config'
import { alreadyEntitledTo } from '@/lib/stripe/purchaseGuard'
import {
  isBillableSubscriptionStatus,
  planChangeAction,
  subscriptionPriceUpdateParams,
} from '@/lib/stripe/planChange'
import { resolveStripePriceId } from '@/lib/commerce/catalogue'
import { joinSeatWaitlist, seatStatusForTier } from '@/lib/commerce/seats'
import { annualBillingAvailable, planAmountCents } from '@/lib/pricing'
import { effectiveTier } from '@/lib/tier'
import { getAppUrl } from '@/lib/urls'

const APP_URL = getAppUrl()

/**
 * Billable subscriptions on this customer. The stored id is preferred when
 * it is still active, trialing, or past_due. A missing stored id with exactly
 * one live subscription is that subscription. Two live subscriptions and no
 * stored id is a duplicate: the caller must not open a third.
 */
async function billableSubscriptions(
  stripe: Stripe,
  customerId: string | null,
  storedId: string | null,
): Promise<{ primary: Stripe.Subscription | null; count: number }> {
  const found: Stripe.Subscription[] = []
  if (storedId) {
    try {
      const stored = await stripe.subscriptions.retrieve(storedId)
      if (isBillableSubscriptionStatus(stored.status)) found.push(stored)
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code !== 'resource_missing') throw err
    }
  }
  if (customerId) {
    const listed = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20,
    })
    for (const sub of listed.data) {
      if (!isBillableSubscriptionStatus(sub.status)) continue
      if (!found.some(existing => existing.id === sub.id)) found.push(sub)
    }
  }
  const primary = storedId
    ? found.find(sub => sub.id === storedId) ?? (found.length === 1 ? found[0] : null)
    : found.length === 1 ? found[0] : null
  return { primary: primary ?? null, count: found.length }
}

export async function POST(request: Request) {
  // 1. Auth gate
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Config gate — refuse cleanly if Stripe isn't wired yet.
  if (!stripeConfigured()) {
    return NextResponse.json({ error: 'Payments are not available yet.' }, { status: 503 })
  }

  // 3. Body validation — plan must be one of the four known keys.
  let body: { plan?: unknown }
  try {
    body = (await request.json()) as { plan?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!isPlanKey(body.plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 422 })
  }
  const plan = body.plan

  // 3b. SPRINT K — annual pricing is undecided, so there is no live annual
  //     price to sell. /pricing hides the annual toggle, but this route is
  //     directly reachable, and the archived $490 / $2,490 prices would be
  //     rejected by Stripe with a 500 rather than a sentence. Refuse here.
  if (!annualBillingAvailable() && PLAN_CATALOG[plan].interval === 'year') {
    return NextResponse.json(
      { error: 'Annual billing is not available yet.' },
      { status: 503 },
    )
  }

  // 4. Who is buying, and do they already hold this tier?
  //
  //    Same tier is a 409. A dead subscription (canceled / unpaid) drops to
  //    community through effectiveTier(), so a churned member can buy again.
  //
  //    A lower tier buying a higher one, or a higher tier moving down, is a
  //    plan CHANGE when a billable subscription already exists. Opening a
  //    Checkout Session there created a second subscription while the first
  //    kept billing. That path updates the existing item instead.
  const profileTier = (profile as unknown as { tier?: string | null }).tier
  const profileTierStatus = (profile as unknown as { tier_status?: string | null }).tier_status
  const { tier, interval } = PLAN_CATALOG[plan]
  const current = effectiveTier(profileTier, profileTierStatus)
  if (current === tier) {
    return NextResponse.json({ error: 'You already have this plan.' }, { status: 409 })
  }

  // 4b. Seat cap. The Evolved Pros 99 sells 99 seats. Checked on a new
  //     checkout AND on an upgrade from VIP, before any Stripe write.
  //     Comps do not count: seatStatusForTier counts live Stripe
  //     subscriptions (migration 094), and a comp has none.
  //
  //     Fails CLOSED: seatStatusForTier returns soldOut when it cannot count.
  const seats = await seatStatusForTier(tier)
  if (seats.soldOut) {
    // A buyer who reached this point is the best-qualified lead the platform
    // will ever have. Refusing them without taking a name is the actual bug.
    const waitlisted = profile.email
      ? await joinSeatWaitlist({
          tier,
          userId: profile.id,
          email: profile.email,
          fullName: profile.full_name ?? null,
          source: 'checkout',
        })
      : 'failed'
    return NextResponse.json(
      {
        error: seats.known
          ? 'Every seat is taken right now.'
          : 'We could not confirm a seat. Try again in a moment.',
        soldOut: seats.known,
        waitlisted: waitlisted !== 'failed',
      },
      { status: 409 },
    )
  }

  // Catalogue only when the active row is the canonical amount. A stale
  // $99 or $849 price id must not be sold. Env is the new monthly price.
  const expectedCents = planAmountCents(plan)
  const priceId =
    (await resolveStripePriceId(tier, interval, expectedCents ?? undefined))
    ?? priceIdForPlan(plan)
  if (!priceId) {
    console.warn('[Stripe Checkout] no Stripe price for plan (catalogue + env empty)', plan)
    return NextResponse.json({ error: 'This plan is not available.' }, { status: 503 })
  }

  if (!profile.email) {
    return NextResponse.json({ error: 'Account missing email. Contact support.' }, { status: 400 })
  }

  const stripe = getStripe()
  const meta = { user_id: profile.id, tier: PLAN_CATALOG[plan].tier, plan }

  try {
    let customerId = (profile as unknown as { stripe_customer_id?: string | null }).stripe_customer_id ?? null
    const storedSubId = (profile as unknown as { stripe_subscription_id?: string | null }).stripe_subscription_id ?? null
    const live = await billableSubscriptions(stripe, customerId, storedSubId)
    const action = planChangeAction({
      sameTier: false,
      entitledAtOrAbove: alreadyEntitledTo(profileTier, profileTierStatus, plan),
      hasBillableSubscription: Boolean(live.primary),
      liveSubscriptionCount: live.count,
    })

    if (action === 'already') {
      return NextResponse.json({ error: 'You already have this plan.' }, { status: 409 })
    }

    if (action === 'refuse-duplicate') {
      console.warn(
        `[Stripe Checkout] duplicate_active_subscriptions user=${profile.id} count=${live.count}`,
      )
      return NextResponse.json(
        { error: 'Your billing account has more than one subscription. Contact support before changing plans.' },
        { status: 409 },
      )
    }

    if (action === 'update') {
      const sub = live.primary
      if (!sub) {
        return NextResponse.json({ error: 'Checkout failed. Try again in a moment.' }, { status: 500 })
      }
      if (live.count > 1) {
        console.warn(
          `[Stripe Checkout] duplicate_active_subscriptions user=${profile.id} count=${live.count} updating=${sub.id}`,
        )
      }
      const item = sub.items?.data?.[0]
      const currentPrice = item?.price?.id ?? null
      if (!item?.id) {
        return NextResponse.json({ error: 'Checkout failed. Try again in a moment.' }, { status: 500 })
      }
      if (currentPrice === priceId) {
        return NextResponse.json({ error: 'You already have this plan.' }, { status: 409 })
      }
      await stripe.subscriptions.update(
        sub.id,
        subscriptionPriceUpdateParams({ itemId: item.id, priceId, metadata: meta }),
      )
      return NextResponse.json({ url: `${APP_URL}/membership?checkout=success` })
    }

    // New subscription. Only reached when this customer has no billable one.
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name ?? undefined,
        metadata: { user_id: profile.id },
      })
      customerId = customer.id
      await (adminClient as any)
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', profile.id)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: profile.id,
      metadata: meta,
      subscription_data: { metadata: meta },
      allow_promotion_codes: true,
      success_url: `${APP_URL}/membership?checkout=success`,
      cancel_url: `${APP_URL}/membership?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    // Code only. A Stripe message can carry request detail, and it was being
    // returned to the browser.
    const code = (err as { code?: string; type?: string }).code ?? (err as { type?: string }).type
    console.error('[Stripe Checkout]', code ?? 'unknown')
    return NextResponse.json({ error: 'Checkout failed. Try again in a moment.' }, { status: 500 })
  }
}
