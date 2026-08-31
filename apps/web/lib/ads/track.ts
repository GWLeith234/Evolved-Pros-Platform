/**
 * Client-side house-ad beacons. Fires gtag on the existing property
 * (window.gtag already configured as G-LLQZZBWWKS) and writes the same
 * event to first-party /api/ads/events for the admin dashboard.
 */

import {
  type HouseAdEventParams,
  type HouseAdIdentity,
  houseAdEventParams,
} from './house'

export type HouseAdTrackKind = 'impression' | 'click'

function fireGtag(eventName: string, params: HouseAdEventParams): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', eventName, {
    creative_name: params.creative_name,
    creative_slot: params.creative_slot,
    promotion_id: params.promotion_id,
    promotion_name: params.promotion_name,
    location_id: params.location_id,
  })
}

function postFirstParty(kind: HouseAdTrackKind, params: HouseAdEventParams): void {
  if (typeof fetch !== 'function') return
  try {
    void fetch('/api/ads/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: kind,
        ad_id: params.promotion_id,
        creative_name: params.creative_name,
        creative_slot: params.creative_slot,
        promotion_id: params.promotion_id,
        promotion_name: params.promotion_name,
        location_id: params.location_id,
      }),
      keepalive: true,
    })
  } catch {
    // Beacon is best-effort — never block the click.
  }
}

/**
 * Impression → gtag view_promotion + first-party row.
 * Click → gtag select_promotion AND house_ad_click + first-party row.
 */
export function recordHouseAdEvent(kind: HouseAdTrackKind, params: HouseAdEventParams): void {
  if (kind === 'impression') {
    fireGtag('view_promotion', params)
  } else {
    fireGtag('select_promotion', params)
    fireGtag('house_ad_click', params)
  }
  postFirstParty(kind, params)
}

export function recordHouseAdFromUnit(
  kind: HouseAdTrackKind,
  ad: HouseAdIdentity,
  opts: { slot?: string | null; locationId: string },
): void {
  recordHouseAdEvent(kind, houseAdEventParams(ad, opts))
}
