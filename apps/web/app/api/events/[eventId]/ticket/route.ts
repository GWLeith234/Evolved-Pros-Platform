/**
 * POST /api/events/[eventId]/ticket
 *
 * One-time Checkout Session for a paid LIVE event. The list price is
 * events.price_cents. The member percent comes from LIVE_DISCOUNT_PCT
 * (PLACEHOLDER env, see lib/live/discountConfig.ts) for the caller's
 * effective tier. Logged-out buyers and Community pay the list price.
 *
 * The request body is not a price. A client-sent tier, percent, or
 * unit_amount is ignored. The discounted unit_amount is set on the
 * Checkout Session line item. This route does not create a Stripe coupon.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { discountedTicketCents, liveDiscountPercent } from '@/lib/live/discountConfig'
import { getStripe, stripeConfigured } from '@/lib/stripe/config'
import { effectiveTier } from '@/lib/tier'
import { toTierKey } from '@/lib/entitlements'
import { getAppUrl } from '@/lib/urls'

const APP_URL = getAppUrl()

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } },
) {
  const eventId = params.eventId?.trim()
  if (!eventId) {
    return NextResponse.json({ error: 'Missing event.' }, { status: 400 })
  }

  // Read and discard. These fields must not affect the charge.
  try {
    await request.json()
  } catch {
    // An empty body is a normal buy click.
  }

  if (!stripeConfigured()) {
    return NextResponse.json({ error: 'Payments are not available yet.' }, { status: 503 })
  }

  const { data, error } = await (adminClient as any)
    .from('events')
    .select('id, title, price_cents, is_published')
    .eq('id', eventId)
    .maybeSingle()

  if (error || !data || data.is_published === false) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
  }

  const listCents = typeof data.price_cents === 'number' ? data.price_cents : 0
  if (!Number.isInteger(listCents) || listCents <= 0) {
    return NextResponse.json({ error: 'This event has no ticket price.' }, { status: 422 })
  }

  const profile = await resolveCurrentUser()
  const tier = profile
    ? toTierKey(effectiveTier(
        (profile as { tier?: string | null }).tier,
        (profile as { tier_status?: string | null }).tier_status,
      ))
    : null
  const percent = liveDiscountPercent(tier)
  const unitAmount = discountedTicketCents(listCents, percent)
  if (unitAmount <= 0) {
    return NextResponse.json({ error: 'This ticket cannot be checked out.' }, { status: 422 })
  }

  const title = typeof data.title === 'string' && data.title.trim()
    ? data.title.trim()
    : 'LIVE event ticket'

  try {
    const stripe = getStripe()
    const customerId = (profile as { stripe_customer_id?: string | null } | null)?.stripe_customer_id ?? null
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: profile?.id,
      customer: customerId ?? undefined,
      customer_email: customerId ? undefined : profile?.email ?? undefined,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: unitAmount,
          product_data: {
            name: title,
            metadata: {
              event_id: eventId,
              list_unit_amount: String(listCents),
            },
          },
        },
      }],
      metadata: {
        kind: 'live_ticket',
        event_id: eventId,
        user_id: profile?.id ?? '',
        tier: tier ?? '',
        discount_pct: String(percent),
        list_unit_amount: String(listCents),
      },
      success_url: `${APP_URL}/events?ticket=success`,
      cancel_url: `${APP_URL}/events?ticket=cancelled`,
    })
    if (!session.url) {
      return NextResponse.json({ error: 'Checkout failed. Try again in a moment.' }, { status: 500 })
    }
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const code = (err as { code?: string; type?: string }).code ?? (err as { type?: string }).type
    console.error('[LIVE ticket checkout]', code ?? 'unknown')
    return NextResponse.json({ error: 'Checkout failed. Try again in a moment.' }, { status: 500 })
  }
}
