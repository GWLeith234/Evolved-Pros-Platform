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

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { getStripe, isPlanKey, priceIdForPlan, PLAN_CATALOG, stripeConfigured } from '@/lib/stripe/config'
import { alreadyEntitledTo } from '@/lib/stripe/purchaseGuard'
import { resolveStripePriceId } from '@/lib/commerce/catalogue'
import { joinSeatWaitlist, seatStatusForTier } from '@/lib/commerce/seats'
import { annualBillingAvailable } from '@/lib/pricing'
import { getAppUrl } from '@/lib/urls'

const APP_URL = getAppUrl()

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

  // 4. Repurchase guard (SPRINT PRICE-1). THIS is the check that prevents
  //    double billing — the /pricing UI can be bypassed by posting here
  //    directly, so the server must refuse independently.
  //
  //    Goes through effectiveTier() so a dead subscription (canceled/unpaid)
  //    correctly does NOT block re-purchasing the same tier, and through
  //    hasTierAccess() so a Pro blocks a VIP purchase by rank rather than by
  //    string equality. Same-tier on a different interval is also refused: a
  //    monthly→annual switch is a plan change and belongs in the billing
  //    portal, not a second subscription.
  const profileTier = (profile as unknown as { tier?: string | null }).tier
  const profileTierStatus = (profile as unknown as { tier_status?: string | null }).tier_status
  if (alreadyEntitledTo(profileTier, profileTierStatus, plan)) {
    return NextResponse.json({ error: 'You already have this plan.' }, { status: 409 })
  }

  const { tier, interval } = PLAN_CATALOG[plan]

  // 4b. SPRINT L - seat cap. The Evolved Pros 99 sells 99 seats, and Stripe
  //     will bill an unlimited number of subscriptions against one price if
  //     nobody stops it. This is the door check; the webhook reconciles the
  //     race two simultaneous buyers of seat 99 would win (see its handler).
  //
  //     Fails CLOSED: seatStatusForTier returns soldOut when it cannot count.
  //     Somebody retrying in a minute is a much smaller problem than somebody
  //     paying $849 for a room that is already full.
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

  // Source of truth is our catalogue (prices.stripe_price_id); env vars are a
  // backward-compat fallback until every price is mirrored to Stripe.
  const priceId = (await resolveStripePriceId(tier, interval)) ?? priceIdForPlan(plan)
  if (!priceId) {
    console.warn('[Stripe Checkout] no Stripe price for plan (catalogue + env empty)', plan)
    return NextResponse.json({ error: 'This plan is not available.' }, { status: 503 })
  }

  if (!profile.email) {
    return NextResponse.json({ error: 'Account missing email — contact support.' }, { status: 400 })
  }

  const stripe = getStripe()

  try {
    // 4. Reuse or create the Stripe customer, persisted on the user row so
    //    upgrades / the billing portal reuse the same customer.
    let customerId = (profile as unknown as { stripe_customer_id?: string | null }).stripe_customer_id ?? null
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

    // 5. Create the subscription Checkout Session. Tier is carried in metadata
    //    (belt) and re-derived from the price id in the webhook (braces).
    const meta = { user_id: profile.id, tier: PLAN_CATALOG[plan].tier, plan }
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
