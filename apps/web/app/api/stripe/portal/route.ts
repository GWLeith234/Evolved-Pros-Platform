/**
 * POST /api/stripe/portal — SPRINT I Phase 1 (Stripe, TEST MODE)
 *
 * Creates a Stripe Billing Portal session so a member can manage / cancel /
 * update their subscription and payment method — no custom billing UI. Returns
 * the portal URL; the client redirects to it.
 *
 * Reply: { url } on success, { error } otherwise.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { getStripe, stripeConfigured } from '@/lib/stripe/config'
import { effectiveTier, hasTierAccess } from '@/lib/tier'
import { getAppUrl } from '@/lib/urls'

const APP_URL = getAppUrl()

export async function POST() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!stripeConfigured()) {
    return NextResponse.json({ error: 'Billing is not available yet.' }, { status: 503 })
  }

  // SPRINT PRICE-1 — paid-tier gate. A free member has no subscription to
  // manage, and a churned one whose stripe_customer_id is still on file would
  // otherwise be handed a live portal session. Uses effectiveTier so a dead
  // subscription reads as community and is refused.
  const tier = (profile as unknown as { tier?: string | null }).tier
  const tierStatus = (profile as unknown as { tier_status?: string | null }).tier_status
  if (!hasTierAccess(effectiveTier(tier, tierStatus), 'vip')) {
    return NextResponse.json({ error: 'No active subscription to manage.' }, { status: 403 })
  }

  const customerId = (profile as unknown as { stripe_customer_id?: string | null }).stripe_customer_id
  if (!customerId) {
    return NextResponse.json({ error: 'No billing account on file.' }, { status: 409 })
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/pricing`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const code = (err as { code?: string; type?: string }).code
      ?? (err as { type?: string }).type
      ?? 'portal_error'
    console.error('[Stripe Portal]', code)
    return NextResponse.json({ error: 'Could not open the billing portal.' }, { status: 500 })
  }
}
