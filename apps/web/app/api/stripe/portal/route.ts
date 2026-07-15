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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.evolvedpros.com'

export async function POST() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!stripeConfigured()) {
    return NextResponse.json({ error: 'Billing is not available yet.' }, { status: 503 })
  }

  const customerId = (profile as unknown as { stripe_customer_id?: string | null }).stripe_customer_id
  if (!customerId) {
    return NextResponse.json({ error: 'No billing account on file.' }, { status: 409 })
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/membership`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not open billing portal'
    console.error('[Stripe Portal]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
