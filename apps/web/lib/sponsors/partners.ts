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
/** Home mid-scroll + LIVE: two single units between sections, never a row. */
export const PAGE_IAB_MAX = 2
/** @deprecated Use PAGE_IAB_MAX — kept so older imports do not break. */
export const FOOTER_IAB_MAX = PAGE_IAB_MAX
/** In-feed stream on a long magazine / community / academy scroll. */
export const IN_FEED_IAB_MAX = 8
/** Podcast archive: enough Zone E boxes for 4 / ad / 4 / ad. */
export const PODCAST_IAB_MAX = 8
/** Article in-body units at scroll-depth breaks. */
export const ARTICLE_IAB_MAX = 5
/** Academy curriculum stream — banners, squares, and big boxes. */
export const ACADEMY_IAB_MAX = 6
/** Community feed mix of 300×250 + 728×90. */
export const COMMUNITY_FEED_MAX = 8
/** Rail: one large + one thin, never a stack of the same size. */
export const RAIL_IAB_MAX = 2

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
  return spreadNonAdjacentAds(stills)
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
  return spreadNonAdjacentAds(
    dedupeIabStillsBySponsor(
      list.filter(a => isIabImageStill(a) && !isLeaderboardStill(a)),
      'E',
    ),
  ).slice(0, PODCAST_IAB_MAX)
}

/** Exactly two sponsors for /home mid-scroll — daily rotation, no dups.
 *  Home stays Evolution Partners only (no Academy self-promo in that row). */
export function pickHomeSponsors(list: SponsorAd[]): SponsorAd[] {
  return pickLiveStills(list, PAGE_IAB_MAX, 11)
}

/** Zone E 300×600 for the end of the home scroll. Never the same advertiser
 *  as a mid-scroll unit. Empty when no unused big box exists. */
export function pickHomeEndBigBox(list: SponsorAd[], exclude: SponsorAd[] = []): SponsorAd | null {
  const excludeKeys = new Set(exclude.map(advertiserFamilyKey).filter(Boolean))
  const boxes = pickLiveStills(list, 4, 71, 'E').filter(
    a => !excludeKeys.has(advertiserFamilyKey(a)),
  )
  return boxes[0] ?? null
}

/** Weave banners (C), squares (A), and big boxes (E) so the scroll
 *  alternates size. Same advertiser never sits twice in a row. */
export function pickMixedScrollAds(list: SponsorAd[], count: number, salt = 23): SponsorAd[] {
  const n = Math.max(1, count)
  const banners = pickScrollBanners(list, n)
  const squares = pickLiveStills(list, n, salt, 'A')
  const boxes = pickLiveStills(list, n, salt + 6, 'E')
  const seen = new Set<string>()
  const woven: SponsorAd[] = []
  const max = Math.max(banners.length, squares.length, boxes.length)
  for (let i = 0; i < max; i++) {
    for (const ad of [banners[i], squares[i], boxes[i]]) {
      if (!ad || seen.has(ad.id)) continue
      seen.add(ad.id)
      woven.push(ad)
    }
  }
  return spreadNonAdjacentAds(woven).slice(0, n)
}

export type MediaFeedAds = {
  /** Rail: large (300×600) then thin (728×90 / 300×250). Never the same size twice. */
  sidebar: SponsorAd[]
  /** Mixed banners / squares / boxes — one unit between story rows. */
  inFeed: SponsorAd[]
}

export type ArticleAds = {
  sidebar: SponsorAd[]
  inBody: SponsorAd[]
}

function takeAlternatingRail(list: SponsorAd[]): SponsorAd[] {
  const large = pickLiveStills(list, 1, 47, 'E')[0] ?? pickLiveStills(list, 1, 47, 'A')[0] ?? null
  if (!large) return []
  const largeKey = advertiserFamilyKey(large)
  const thinBanner = pickScrollBanners(list, 4).find(a => advertiserFamilyKey(a) !== largeKey)
  const thinSquare = pickLiveStills(list, 4, 59, 'A').find(a => advertiserFamilyKey(a) !== largeKey)
  const thin = thinBanner ?? thinSquare ?? null
  return thin ? spreadNonAdjacentAds([large, thin]).slice(0, RAIL_IAB_MAX) : [large]
}

function excludeKeys(ads: SponsorAd[]): Set<string> {
  return new Set(ads.map(advertiserFamilyKey).filter(Boolean))
}

/**
 * Media magazine feed. Rail alternates large then thin. Remaining
 * inventory walks the story scroll one at a time. Destinations are
 * the stored click_url. No footer pair.
 */
export function pickMediaFeedAds(list: SponsorAd[]): MediaFeedAds {
  const sidebar = takeAlternatingRail(list)
  const taken = excludeKeys(sidebar)
  const mixed = pickMixedScrollAds(list, IN_FEED_IAB_MAX + sidebar.length, 53).filter(
    a => !taken.has(advertiserFamilyKey(a)),
  )
  const inFeed = spreadNonAdjacentAds(mixed).slice(0, IN_FEED_IAB_MAX)
  return { sidebar, inFeed }
}

/**
 * Article: rail alternates large then thin; in-body IABs at scroll-depth
 * breaks. Sidebar and in-body never share the same advertiser.
 */
export function pickArticleAds(list: SponsorAd[]): ArticleAds {
  const sidebar = takeAlternatingRail(list)
  const taken = excludeKeys(sidebar)
  const mixed = pickMixedScrollAds(list, ARTICLE_IAB_MAX + sidebar.length, 73).filter(
    a => !taken.has(advertiserFamilyKey(a)),
  )
  const inBody = spreadNonAdjacentAds(mixed).slice(0, ARTICLE_IAB_MAX)
  return { sidebar, inBody }
}

/** Academy / LIVE stream — banners, squares, and big boxes, one at a time. */
export function pickAcademySponsors(list: SponsorAd[], count = 4): SponsorAd[] {
  const n = Math.min(ACADEMY_IAB_MAX, Math.max(1, count))
  return pickMixedScrollAds(list, n, 23)
}

/** Community feed — 300×250 squares AND 728×90 banners, spread advertisers. */
export function pickCommunityFeedAds(list: SponsorAd[], count = COMMUNITY_FEED_MAX): SponsorAd[] {
  const n = Math.min(COMMUNITY_FEED_MAX, Math.max(1, count))
  const banners = pickScrollBanners(list, n)
  const squares = pickLiveStills(list, n, 41, 'A')
  const seen = new Set<string>()
  const woven: SponsorAd[] = []
  const max = Math.max(banners.length, squares.length)
  for (let i = 0; i < max; i++) {
    for (const ad of [squares[i], banners[i]]) {
      if (!ad || seen.has(ad.id)) continue
      seen.add(ad.id)
      woven.push(ad)
    }
  }
  return spreadNonAdjacentAds(woven).slice(0, n)
}

/** Community rail rotation pool — unique squares, shown one at a time. */
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
