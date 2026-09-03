import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { houseAdHref } from '@/lib/ads/house'
import {
  dedupeIabStillsBySponsor,
  isBlockedLegacyAd,
  isIabImageStill,
  isLeaderboardStill,
  preferIabZone,
} from '@/lib/ads/iab'
import { dedupeSponsors, pickRotatedSponsors, sponsorKey } from './rotate'

function liveCatalog(list: SponsorAd[]): SponsorAd[] {
  return list.filter(a => !isRetiredPartnerAd(a) && !isBlockedLegacyAd(a))
}

/** Max units that may share one cluster. Village rhythm is one. */
export const CLUSTER_IAB_MAX = 1
/** Hard cap for any single page stream. More than this reads as a board. */
export const PAGE_IAB_MAX = 2
/** @deprecated Use PAGE_IAB_MAX — kept so older imports do not break. */
export const FOOTER_IAB_MAX = PAGE_IAB_MAX
/** In-feed stream on a long magazine scroll. */
export const IN_FEED_IAB_MAX = 2
/** Podcast archive + episode: one 300×600, never a pair of big boxes. */
export const PODCAST_IAB_MAX = 1

function pickLiveStills(
  list: SponsorAd[],
  count: number,
  salt: number,
  zone: 'A' | 'E' = 'A',
): SponsorAd[] {
  const cards = liveCatalog(list)
    .filter(isIabImageStill)
    .filter(a => !isLeaderboardStill(a))
  const stills = preferIabZone(cards, zone)
  if (!stills.length) return []
  return pickRotatedSponsors(dedupeIabStillsBySponsor(stills, zone), count, { salt })
}

export { dedupeSponsors, pickRotatedSponsors, shuffleSponsors, sponsorKey, dailySeed } from './rotate'

/** Partners removed from the program — filtered out of every rotation pool. */
function isRetiredPartnerAd(ad: Pick<SponsorAd, 'sponsor_name' | 'tool_name'>): boolean {
  const name = `${ad.sponsor_name ?? ''} ${ad.tool_name ?? ''}`.toLowerCase()
  return name.includes('vendasta')
}

/** Fixed UUID for Evolved Pros Academy self-promo (not a partner). */
export const ACADEMY_AD_ID = 'c0a1b2c3-d4e5-4789-abcd-ef1234567aca'

/** Fallback IAB slot for architecture / portrait cards (not a banner). */
const ACADEMY_FALLBACK_HREF = houseAdHref('300x250')

export const ACADEMY_SPONSOR_AD: SponsorAd = {
  id: ACADEMY_AD_ID,
  sponsor_name: 'Evolved Pros Academy',
  tool_name: 'Academy',
  headline: 'Stop collecting tips. Build the system.',
  endorsement_quote:
    'Six pillars. One architecture. The framework operators use to make excellence inevitable.',
  cta_text: 'Enter the Academy',
  image_url: '/ads/academy-portrait.png',
  click_url: ACADEMY_FALLBACK_HREF,
  link_url: ACADEMY_FALLBACK_HREF,
}

/** Upgrade-focused Academy promo (membership CTA → /pricing). */
export const ACADEMY_UPGRADE_AD: SponsorAd = {
  id: 'c0a1b2c3-d4e5-4789-abcd-ef1234567acb',
  sponsor_name: 'Evolved Pros Academy',
  tool_name: 'Academy',
  headline: 'Unlock the pillars that change how you operate.',
  endorsement_quote:
    'Strategy, Accountability, and Execution are Pro. Build the full architecture — not half of it.',
  cta_text: 'Upgrade to Pro',
  image_url: '/ads/academy-portrait.png',
  click_url: ACADEMY_FALLBACK_HREF,
  link_url: ACADEMY_FALLBACK_HREF,
}

export function isEvolveXAd(ad: {
  sponsor_name?: string | null
  tool_name?: string | null
  image_url?: string | null
}): boolean {
  const hay = `${ad.sponsor_name ?? ''} ${ad.tool_name ?? ''} ${ad.image_url ?? ''}`.toLowerCase()
  return hay.includes('evolvex')
}

/** Academy self-promo and EvolveX360 — first-party, never sit adjacent. */
export function isFirstPartyAd(ad: {
  id?: string | null
  sponsor_name?: string | null
  tool_name?: string | null
  image_url?: string | null
  click_url?: string | null
  link_url?: string | null
}): boolean {
  return isAcademyAd(ad) || isEvolveXAd(ad)
}

/** Stable family key: Academy and EvolveX360 stay distinct first-party brands. */
export function advertiserFamilyKey(ad: {
  id?: string | null
  sponsor_name?: string | null
  tool_name?: string | null
  image_url?: string | null
  click_url?: string | null
  link_url?: string | null
}): string {
  if (isAcademyAd(ad)) return 'first-party:academy'
  if (isEvolveXAd(ad)) return 'first-party:evolvex'
  const name = `${ad.sponsor_name ?? ''}|${ad.tool_name ?? ''}`.toLowerCase().trim()
  return name || ad.id || ''
}

/** Same advertiser, or two first-party house units, must not sit side by side. */
export function adsConflictAdjacent(
  a: Parameters<typeof advertiserFamilyKey>[0],
  b: Parameters<typeof advertiserFamilyKey>[0],
): boolean {
  if (!a || !b) return false
  if (advertiserFamilyKey(a) === advertiserFamilyKey(b)) return true
  return isFirstPartyAd(a) && isFirstPartyAd(b)
}

/** Greedy order that drops a unit rather than placing a conflicting neighbor. */
export function spreadNonAdjacentAds<T extends Parameters<typeof adsConflictAdjacent>[0]>(
  list: T[],
): T[] {
  if (list.length <= 1) return [...list]
  const remaining = [...list]
  const out: T[] = []
  while (remaining.length) {
    const prev = out[out.length - 1]
    const idx = remaining.findIndex(ad => !prev || !adsConflictAdjacent(prev, ad))
    if (idx === -1) break
    out.push(remaining.splice(idx, 1)[0] as T)
  }
  return out
}

export function isAcademyAd(ad: {
  id?: string | null
  sponsor_name?: string | null
  tool_name?: string | null
  image_url?: string | null
  click_url?: string | null
  link_url?: string | null
}): boolean {
  const name = `${ad.sponsor_name ?? ''} ${ad.tool_name ?? ''}`.toLowerCase()
  // Paid partners never count as house, even if a UUID collided in an older seed.
  if (name.includes('adcellerant') || name.includes('evolvex') || name.includes('xpr')) return false
  if (ad.id === ACADEMY_AD_ID || ad.id === ACADEMY_UPGRADE_AD.id) return true
  if (name.includes('evolved pros academy') || name === 'academy') return true
  const href = `${ad.click_url ?? ''} ${ad.link_url ?? ''}`.toLowerCase()
  if (href.includes('utm_source=house') && href.includes('utm_campaign=academy')) return true
  if (href.includes('/academy') || href.includes('/membership') || href.includes('/pricing')) {
    // Membership / pricing CTA is still Academy self-promo when the row is labeled Academy.
    if (name.includes('academy') || (ad.image_url ?? '').toLowerCase().includes('academy')) return true
  }
  const img = (ad.image_url ?? '').toLowerCase()
  return img.includes('/ads/academy') || img.includes('academy-300') || img.includes('academy-portrait')
}

/**
 * Ensure flagship Evolution Partners are present in the pool (deduped).
 * Academy self-promo is never injected here — use pickAcademySponsors /
 * ensurePodcastSponsors for that.
 */
export function ensureFlagshipSponsors(list: SponsorAd[]): SponsorAd[] {
  // Live stills / DB rows only — never inject Denver-DBJ, logo-only EVX, or XPR.
  return dedupeSponsors(liveCatalog(list).filter(a => !isAcademyAd(a) || isIabImageStill(a)))
}

/**
 * Podcast archive + episode pool: Zone E 300×600 big boxes.
 * Never interleaves 300×250 squares into the episode card grid.
 */
export function ensurePodcastSponsors(list: SponsorAd[]): SponsorAd[] {
  const stills = pickLiveStills(list, PODCAST_IAB_MAX, 17, 'E')
  if (stills.length) return stills
  return []
}

/**
 * 728×90 leaderboards for mid-scroll — less intrusive than a stack of squares.
 * Empty when no Zone C rows exist; never falls back to A/E.
 */
export function pickScrollBanners(list: SponsorAd[], count = 1): SponsorAd[] {
  const n = Math.min(IN_FEED_IAB_MAX, Math.max(1, count))
  const banners = liveCatalog(list).filter(isIabImageStill).filter(isLeaderboardStill)
  if (!banners.length) return []
  return pickRotatedSponsors(dedupeIabStillsBySponsor(banners, 'C'), n, { salt: 31 })
}

/** Archive slots: prefer E, never a 728×90, never more than PODCAST_IAB_MAX. */
export function selectPodcastBigBoxes(list: SponsorAd[]): SponsorAd[] {
  return dedupeIabStillsBySponsor(
    list.filter(a => isIabImageStill(a) && !isLeaderboardStill(a)),
    'E',
  ).slice(0, PODCAST_IAB_MAX)
}

/** Exactly two sponsors for /home main row — daily rotation, no dups.
 *  Home stays Evolution Partners only (no Academy self-promo in that row). */
export function pickHomeSponsors(list: SponsorAd[]): SponsorAd[] {
  return pickLiveStills(list, PAGE_IAB_MAX, 11)
}

export type MediaFeedAds = {
  /** Optional single sticky half-page (300×600) or square beside the story. */
  sidebar: SponsorAd | null
  /** Zone C banners + leftover squares — one unit between story rows. */
  inFeed: SponsorAd[]
}

export type ArticleAds = {
  sidebar: SponsorAd | null
  inBody: SponsorAd[]
}

function takeSidebar(list: SponsorAd[]): SponsorAd | null {
  return pickLiveStills(list, 1, 47, 'E')[0] ?? pickLiveStills(list, 1, 47, 'A')[0] ?? null
}

/**
 * Media magazine feed. One sticky rail unit; remaining inventory walks
 * the story scroll one at a time. Destinations are the stored click_url.
 * No footer pair — leftover units that have no content spacer stay unused
 * rather than clustering at the bottom.
 */
export function pickMediaFeedAds(list: SponsorAd[]): MediaFeedAds {
  const sidebar = takeSidebar(list)
  const sidebarKey = sidebar ? advertiserFamilyKey(sidebar) : ''
  const banners = pickScrollBanners(list, IN_FEED_IAB_MAX)
  const squares = pickLiveStills(list, 6, 53, 'A').filter(
    s => advertiserFamilyKey(s) !== sidebarKey,
  )
  const bannerKeys = new Set(banners.map(advertiserFamilyKey))
  const leftoverSquares = squares.filter(s => !bannerKeys.has(advertiserFamilyKey(s)))
  const inFeed = spreadNonAdjacentAds([...banners, ...leftoverSquares]).slice(0, IN_FEED_IAB_MAX)
  return { sidebar, inFeed }
}

/**
 * Article: one sticky sidebar unit; up to two in-body IABs (after copy).
 * Sidebar and in-body never share the same advertiser.
 */
export function pickArticleAds(list: SponsorAd[]): ArticleAds {
  const sidebar = takeSidebar(list)
  const sidebarKey = sidebar ? advertiserFamilyKey(sidebar) : ''
  const banners = pickScrollBanners(list, 2).filter(a => advertiserFamilyKey(a) !== sidebarKey)
  const squares = pickLiveStills(list, 4, 73, 'A').filter(s => advertiserFamilyKey(s) !== sidebarKey)
  const bannerKeys = new Set(banners.map(advertiserFamilyKey))
  const extra = squares.filter(s => !bannerKeys.has(advertiserFamilyKey(s)))
  const inBody = spreadNonAdjacentAds([...banners, ...extra]).slice(0, 1)
  return { sidebar, inBody }
}

/** In-feed stream for Academy / LIVE — callers place units one at a time. */
export function pickAcademySponsors(list: SponsorAd[], count = 2): SponsorAd[] {
  const n = Math.min(IN_FEED_IAB_MAX, Math.max(1, count))
  return pickLiveStills(list, n, 23)
}

/** Community rail partners — up to 4, rotated, unique. Partners only. */
export function pickCommunityRailSponsors(list: SponsorAd[], count = 4): SponsorAd[] {
  const n = Math.min(4, Math.max(1, count))
  return pickLiveStills(list, n, 41)
}

/**
 * Pick a sidebar / secondary ad that does not duplicate primary placements.
 */
export function pickSidebarSponsor(
  list: SponsorAd[],
  exclude: SponsorAd[],
): SponsorAd | null {
  const stills = pickLiveStills(list, 4, 59).filter(a => !exclude.some(e => sponsorKey(e) === a.id || e.sponsor_name === a.sponsor_name))
  return stills[0] ?? null
}
