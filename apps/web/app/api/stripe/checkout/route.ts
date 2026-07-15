/**
 * POST /api/stripe/checkout — SPRINT I Phase 1 (Stripe, TEST MODE)
 *
 * Server-side Stripe Checkout Session flow for the Community → VIP → Pro
 * upgrade. Hosted Checkout (no card data touches us). Runs alongside the
 * legacy Vendasta /api/checkout until the round-trip is proven; the client
 * only routes here when NEXT_PUBLIC_PAYMENTS_PROVIDER === 'stripe'.
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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.evolvedpros.com'

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

  const priceId = priceIdForPlan(plan)
  if (!priceId) {
    console.warn('[Stripe Checkout] price env not set for plan', plan)
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
    const message = err instanceof Error ? err.message : 'Checkout failed'
    console.error('[Stripe Checkout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
