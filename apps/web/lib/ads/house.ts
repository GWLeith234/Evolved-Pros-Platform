/**
 * House / Academy self-promo ads — destination lock, IAB slot, GA4 params.
 *
 * Locked destination is /pricing (never /join, /academy, /membership).
 * Events reuse the existing gtag property (G-LLQZZBWWKS) — no second GA4 ID.
 */

export const HOUSE_AD_SLOTS = ['300x250', '728x90', '300x600'] as const
export type HouseAdSlot = (typeof HOUSE_AD_SLOTS)[number]

export const HOUSE_PROMOTION_NAME = 'academy_house' as const

export const HOUSE_UTM = {
  utm_source: 'house',
  utm_medium: 'display',
  utm_campaign: 'academy',
} as const

/** IAB zone letters used by platform_ads.zone / the admin banner editor. */
export const IAB_ZONE_TO_SLOT: Record<string, HouseAdSlot> = {
  A: '300x250',
  C: '728x90',
  E: '300x600',
}

export const IAB_SLOT_TO_ZONE: Record<HouseAdSlot, string> = {
  '300x250': 'A',
  '728x90': 'C',
  '300x600': 'E',
}

export type HouseAdIdentity = {
  id?: string | null
  sponsor_name?: string | null
  tool_name?: string | null
  headline?: string | null
  image_url?: string | null
  click_url?: string | null
  link_url?: string | null
  zone?: string | null
}

export function isHouseAdSlot(value: unknown): value is HouseAdSlot {
  return typeof value === 'string' && (HOUSE_AD_SLOTS as readonly string[]).includes(value)
}

/** /pricing?utm_source=house&utm_medium=display&utm_campaign=academy&utm_content=<size> */
export function houseAdHref(slot: HouseAdSlot): string {
  const params = new URLSearchParams({
    utm_source: HOUSE_UTM.utm_source,
    utm_medium: HOUSE_UTM.utm_medium,
    utm_campaign: HOUSE_UTM.utm_campaign,
    utm_content: slot,
  })
  return `/pricing?${params.toString()}`
}

/**
 * Infer the IAB slot from an explicit hint, zone letter, or creative filename.
 * Defaults to 300x250 (medium rectangle) for architecture / portrait cards.
 */
export function inferHouseAdSlot(ad: HouseAdIdentity, hint?: string | null): HouseAdSlot {
  if (isHouseAdSlot(hint)) return hint
  const zone = (ad.zone ?? '').trim().toUpperCase()
  if (zone && IAB_ZONE_TO_SLOT[zone]) return IAB_ZONE_TO_SLOT[zone]

  const hay = `${ad.image_url ?? ''} ${ad.click_url ?? ''} ${ad.link_url ?? ''}`.toLowerCase()
  if (hay.includes('300x600') || hay.includes('300-600')) return '300x600'
  if (hay.includes('728x90') || hay.includes('728-90')) return '728x90'
  if (hay.includes('300x250') || hay.includes('300-250')) return '300x250'
  return '300x250'
}

export type HouseAdEventParams = {
  creative_name: string
  creative_slot: HouseAdSlot
  promotion_id: string
  promotion_name: typeof HOUSE_PROMOTION_NAME
  location_id: string
}

export function houseAdEventParams(
  ad: HouseAdIdentity,
  opts: { slot?: HouseAdSlot | string | null; locationId: string },
): HouseAdEventParams {
  const slot = inferHouseAdSlot(ad, opts.slot)
  const creativeName =
    ad.headline?.trim() ||
    ad.sponsor_name?.trim() ||
    ad.tool_name?.trim() ||
    'Evolved Pros Academy'
  return {
    creative_name: creativeName,
    creative_slot: slot,
    promotion_id: ad.id ?? 'academy-house',
    promotion_name: HOUSE_PROMOTION_NAME,
    location_id: opts.locationId,
  }
}

/** Destination for a served unit: house ads always /pricing + UTMs. */
export function resolveServedAdHref(
  ad: HouseAdIdentity,
  isHouse: boolean,
  slot?: HouseAdSlot | string | null,
): string | null {
  if (isHouse) return houseAdHref(inferHouseAdSlot(ad, slot))
  return [ad.click_url, ad.link_url].find(u => typeof u === 'string' && u && u !== '#') ?? null
}
