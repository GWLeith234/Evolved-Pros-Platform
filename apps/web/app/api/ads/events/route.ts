export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import {
  HOUSE_PROMOTION_NAME,
  isHouseAdSlot,
} from '@/lib/ads/house'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function asTrimmed(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

/**
 * Public ingest for house-ad impressions/clicks.
 * Writes first-party ad_events (admin dashboard source of truth).
 * gtag is fired on the client against the existing GA4 property — this
 * route does not talk to the GA4 Data API and does not require a key.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = body.event_type === 'click' ? 'click' : body.event_type === 'impression' ? 'impression' : null
  if (!eventType) {
    return NextResponse.json({ error: 'event_type must be impression or click' }, { status: 422 })
  }

  const slot = body.creative_slot
  if (!isHouseAdSlot(slot)) {
    return NextResponse.json({ error: 'creative_slot must be 300x250, 728x90, or 300x600' }, { status: 422 })
  }

  const promotionName = asTrimmed(body.promotion_name, 80) ?? HOUSE_PROMOTION_NAME
  if (promotionName !== HOUSE_PROMOTION_NAME) {
    // Partner ads must not land in the house results table.
    return NextResponse.json({ error: 'promotion_name must be academy_house' }, { status: 422 })
  }

  const promotionId = asTrimmed(body.promotion_id, 80) ?? asTrimmed(body.ad_id, 80)
  if (!promotionId) {
    return NextResponse.json({ error: 'promotion_id required' }, { status: 422 })
  }

  const adId = UUID_RE.test(promotionId) ? promotionId : null

  const row = {
    ad_id: adId,
    event_type: eventType,
    creative_name: asTrimmed(body.creative_name, 200),
    creative_slot: slot,
    promotion_id: promotionId,
    promotion_name: HOUSE_PROMOTION_NAME,
    location_id: asTrimmed(body.location_id, 200),
  }

  // Service-role insert — ad_events is RLS-locked with no client policies.
  // Table is new (082); typed client may not list it until types are regenerated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any).from('ad_events').insert(row)

  if (error) {
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
