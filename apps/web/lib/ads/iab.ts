/**
 * IAB display stills vs text/logo partner units.
 *
 * Tonight's platform_ads Image rows (title "Ad", headline/cta/body NULL)
 * ARE the creative. They must render as a clickable image at 300×250 /
 * 728×90 / 300×600 — no Partner chrome, no duplicate name, no extra CTA,
 * no 1:1 crop. Partner / Academy / premium cards stay for units that
 * carry copy (headline, CTA, body).
 */

import {
  HOUSE_AD_SLOTS,
  IAB_ZONE_TO_SLOT,
  inferHouseAdSlot,
  type HouseAdIdentity,
  type HouseAdSlot,
} from './house'

export const IAB_SLOT_PX: Record<HouseAdSlot, { w: number; h: number }> = {
  '300x250': { w: 300, h: 250 },
  '728x90': { w: 728, h: 90 },
  '300x600': { w: 300, h: 600 },
}

export type IabAdIdentity = HouseAdIdentity & {
  ad_type?: string | null
  title?: string | null
  headline?: string | null
  cta_text?: string | null
  body_copy?: string | null
  endorsement_quote?: string | null
  image_url?: string | null
  start_date?: string | null
  end_date?: string | null
  is_active?: boolean | null
  placement?: string | null
  placements?: string[] | null
  zone?: string | null
}

function blank(value: string | null | undefined): boolean {
  return !value || !value.trim()
}

/**
 * Full-creative Image still: the PNG is the ad.
 * Image-typed / IAB-zoned rows stay stills even if leftover headline/CTA
 * is on the row — wrapping those in Partner chrome (duplicate name +
 * LEARN MORE) is the Academy bug. Copy-only / native units stay cards.
 */
export function isIabImageStill(ad: IabAdIdentity): boolean {
  if (blank(ad.image_url)) return false
  const type = (ad.ad_type ?? '').trim().toLowerCase()
  if (type && type !== 'image') return false

  if (type === 'image') return true

  const zone = (ad.zone ?? '').trim().toUpperCase()
  if (zone && IAB_ZONE_TO_SLOT[zone]) return true

  if (!blank(ad.headline) || !blank(ad.cta_text) || !blank(ad.body_copy)) return false

  const title = (ad.title ?? '').trim().toLowerCase()
  if (!title || title === 'ad') return true

  const hay = `${ad.image_url ?? ''} ${ad.click_url ?? ''} ${ad.link_url ?? ''}`.toLowerCase()
  return HOUSE_AD_SLOTS.some(slot => hay.includes(slot) || hay.includes(slot.replace('x', '-')))
}

export function iabSlotPx(ad: IabAdIdentity, hint?: string | null): { w: number; h: number; slot: HouseAdSlot } {
  const slot = inferHouseAdSlot(ad, hint)
  const px = IAB_SLOT_PX[slot]
  return { ...px, slot }
}

/** Zone letter from the row, or from utm_content / filename (728x90 → C). */
export function resolveIabZone(ad: IabAdIdentity): string {
  const z = (ad.zone ?? '').trim().toUpperCase()
  if (z && IAB_ZONE_TO_SLOT[z]) return z
  const hay = `${ad.image_url ?? ''} ${ad.click_url ?? ''} ${ad.link_url ?? ''}`.toLowerCase()
  if (hay.includes('728x90') || hay.includes('728-90')) return 'C'
  if (hay.includes('300x600') || hay.includes('300-600')) return 'E'
  if (hay.includes('300x250') || hay.includes('300-250')) return 'A'
  return z
}

/** 728×90 leaderboards do not belong in portrait / sidebar / featured cards. */
export function isLeaderboardStill(ad: IabAdIdentity): boolean {
  return resolveIabZone(ad) === 'C'
}

/** Stored destination only — never rewrite house stills to /pricing. */
export function iabClickHref(ad: IabAdIdentity): string | null {
  return [ad.click_url, ad.link_url].find(u => typeof u === 'string' && u.trim() && u !== '#') ?? null
}

/**
 * Admin list treats a passed end_date as expired even when is_active is true.
 * Member/public fetchers must use the same rule so cancelled book rows etc.
 * cannot mix with live stills.
 */
export function isAdScheduleLive(ad: IabAdIdentity, now = Date.now()): boolean {
  if (ad.is_active === false) return false
  if (ad.end_date) {
    const end = new Date(ad.end_date).getTime()
    if (Number.isFinite(end) && end <= now) return false
  }
  if (ad.start_date) {
    const start = new Date(ad.start_date).getTime()
    if (Number.isFinite(start) && start > now) return false
  }
  return true
}

/**
 * Cancelled book / presale units. Do not serve until a real /evolved
 * preorder exists — even if is_active is still true in SQL.
 */
export function isBlockedLegacyAd(ad: IabAdIdentity): boolean {
  const hay = [
    ad.sponsor_name,
    ad.tool_name,
    ad.headline,
    ad.cta_text,
    ad.body_copy,
    ad.title,
    ad.click_url,
    ad.link_url,
    ad.image_url,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  if (hay.includes('b0gslqswj8')) return true
  if (hay.includes('presale') || hay.includes('pre-order') || hay.includes('preorder')) return true
  // Built from parts so page bundles never contain the retired copy verbatim.
  if (hay.includes(['free year of the', 'academy'].join(' '))) return true
  if (hay.includes(['denver business', 'journal'].join(' '))) return true
  if (hay.includes(['#1 largest advertising', 'agency'].join(' '))) return true
  if (hay.includes(['unlock the future with', 'ai solutions'].join(' '))) return true
  if (hay.includes('book-300') || hay.includes('evolved%20book') || hay.includes('evolved book cover')) return true
  const name = `${ad.sponsor_name ?? ''} ${ad.tool_name ?? ''}`.toLowerCase()
  if (name.includes('george leith') && (name.includes('evolved') || hay.includes('book'))) return true
  // Sequential hex joke seeds — never live platform_ads UUIDs.
  if (ad.id && /^(a1b2|b2c3|d4e5)[0-9a-f]{4}-/.test(ad.id)) return true
  const img = ad.image_url ?? ''
  if (img.includes('/sponsors/') && img.includes('adcellerant') && img.includes('logo-white') && img.endsWith('.png')) {
    return true
  }
  return false
}

export function filterLiveAds<T extends IabAdIdentity>(ads: T[], now = Date.now()): T[] {
  return ads.filter(ad => isAdScheduleLive(ad, now) && !isBlockedLegacyAd(ad))
}

const SURFACE_ALIASES: Record<string, string[]> = {
  home: ['home', 'all', 'platform', 'sidebar'],
  academy: ['academy', 'all', 'platform', 'sidebar'],
  community: ['community', 'all', 'platform', 'sidebar'],
  podcast: ['podcast', 'all', 'platform', 'sidebar', 'topnav'],
  media: ['media', 'all', 'platform', 'sidebar', 'topnav'],
  live: ['live', 'all', 'platform', 'sidebar'],
  events: ['events', 'all', 'platform'],
  sidebar: ['sidebar', 'all', 'platform'],
  topnav: ['topnav', 'all', 'platform'],
  platform: ['platform', 'all'],
}

function placementTokens(ad: IabAdIdentity): string[] {
  const raw: unknown = ad.placements
  const list = Array.isArray(raw)
    ? raw.map(String)
    : typeof raw === 'string' && raw.trim()
      ? raw.split(/[{},\s]+/).filter(Boolean)
      : []
  return [...list, ad.placement ?? '']
    .map(p => String(p).toLowerCase().trim())
    .filter(Boolean)
}

/** `placements: [platform]` is a wildcard — including Media (Media checkbox unchecked). */
export function adMatchesSurface(ad: IabAdIdentity, surface: string): boolean {
  const wanted = SURFACE_ALIASES[surface.toLowerCase()] ?? [surface.toLowerCase(), 'platform', 'all']
  const bags = placementTokens(ad)
  if (bags.length === 0) return true
  if (bags.includes('platform') || bags.includes('all')) return true
  return bags.some(p => wanted.includes(p))
}

export function preferIabZone<T extends IabAdIdentity>(ads: T[], zone = 'A'): T[] {
  const letter = zone.toUpperCase()
  const match = ads.filter(ad => resolveIabZone(ad) === letter)
  if (match.length) return match
  // Never fall back to a 728×90 leaderboard in a card/sidebar slot.
  return ads.filter(ad => resolveIabZone(ad) !== 'C')
}

/**
 * Card / feed / featured pool: IAB stills only, never 728×90, one per sponsor.
 * Prefer Zone A (300×250) *per sponsor*; keep E when that brand has no A.
 * Do not run preferIabZone on the whole pool — one A would wipe E-only brands.
 */
export function cardSafeIabStills<T extends IabAdIdentity>(ads: T[], preferZone = 'A'): T[] {
  const cards = ads.filter(isIabImageStill).filter(ad => !isLeaderboardStill(ad))
  return dedupeIabStillsBySponsor(cards, preferZone)
}

/** One still per sponsor so A/C/E sizes of the same brand do not collide. */
export function dedupeIabStillsBySponsor<T extends IabAdIdentity & { id?: string | null; sponsor_name?: string | null; tool_name?: string | null }>(
  ads: T[],
  preferZone = 'A',
): T[] {
  const ranked = [...ads].sort((a, b) => {
    const az = (a.zone ?? '').trim().toUpperCase() === preferZone ? 0 : 1
    const bz = (b.zone ?? '').trim().toUpperCase() === preferZone ? 0 : 1
    return az - bz
  })
  const seen = new Set<string>()
  const out: T[] = []
  for (const ad of ranked) {
    const k = `${ad.sponsor_name ?? ''}|${ad.tool_name ?? ''}`.toLowerCase().trim() || ad.id || ''
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(ad)
  }
  return out
}
