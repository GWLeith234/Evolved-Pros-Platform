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
/** Hard cap for home mid-scroll singles. */
export const PAGE_IAB_MAX = 2
/** @deprecated Use PAGE_IAB_MAX — kept so older imports do not break. */
export const FOOTER_IAB_MAX = PAGE_IAB_MAX
/** In-feed / banner pool for Academy, LIVE, and mid-scroll 728×90s. */
export const IN_FEED_IAB_MAX = 8
/** Media magazine: one unit per row, then denser deeper. Recycle with a gap. */
export const MEDIA_IN_FEED_MAX = 16
/** Story column: one late unit. Prefer end-of-article over a mid-piece stack. */
export const ARTICLE_IN_BODY_MAX = 1
/** Six Academy pillar threads — enough units for an ad every three cards, then every two. */
export const ACADEMY_THREAD_IAB_MAX = 16
/** Podcast archive + episode: 300×600 boxes through the list, recycled with a gap. */
export const PODCAST_IAB_MAX = 8
/** Community feed mix of 300×250 + 728×90. */
export const COMMUNITY_FEED_MAX = 16
/** LIVE speaking page: one unit between major sections. */
export const LIVE_IAB_MAX = 6

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

/**
 * Repeat a spread pool until `count` so a long scroll stays punctuated.
 * Same advertiser never sits next to itself. One advertiser cannot fill
 * two adjacent slots, so a single-brand pool stays at one unit.
 */
export function cycleNonAdjacentAds<T extends Parameters<typeof adsConflictAdjacent>[0]>(
  list: T[],
  count: number,
): T[] {
  const spread = spreadNonAdjacentAds(list)
  if (!spread.length || count <= 0) return []
  const out: T[] = []
  let i = 0
  let skipped = 0
  while (out.length < count && skipped < spread.length) {
    const cand = spread[i % spread.length] as T
    const prev = out[out.length - 1]
    i += 1
    if (prev && adsConflictAdjacent(prev, cand)) {
      skipped += 1
      continue
    }
    out.push(cand)
    skipped = 0
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
  const stills = pickLiveStills(list, 12, 17, 'E')
  if (!stills.length) return []
  return cycleNonAdjacentAds(stills, PODCAST_IAB_MAX)
}

/**
 * 728×90 leaderboards for mid-scroll — less intrusive than a stack of squares.
 * Empty when no Zone C rows exist; never falls back to A/E.
 */
export function pickScrollBanners(list: SponsorAd[], count = 1): SponsorAd[] {
  const n = Math.min(IN_FEED_IAB_MAX, Math.max(1, count))
  const banners = liveCatalog(list).filter(isIabImageStill).filter(isLeaderboardStill)
  if (!banners.length) return []
  return cycleNonAdjacentAds(dedupeIabStillsBySponsor(banners, 'C'), n)
}

/** Archive slots: prefer E, never a 728×90. Recycle with a gap on a long list. */
export function selectPodcastBigBoxes(list: SponsorAd[]): SponsorAd[] {
  const stills = dedupeIabStillsBySponsor(
    list.filter(a => isIabImageStill(a) && !isLeaderboardStill(a)),
    'E',
  )
  return cycleNonAdjacentAds(stills, PODCAST_IAB_MAX)
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
  related: SponsorAd | null
}

export type HomePageAds = {
  /** Existing mid-scroll singles on member /home. */
  mid: SponsorAd[]
  /** Third slot in the member 2-tile row. */
  tileRow: SponsorAd | null
  /** In-row unit after Latest episodes (2 cards). */
  episodeRow: SponsorAd | null
  /** In-row unit after From Evolved Pros Media (2 cards). */
  storyRow: SponsorAd | null
  /** End-of-scroll 300×600 big box. */
  endBox: SponsorAd | null
}

function takeSidebar(list: SponsorAd[]): SponsorAd | null {
  return pickLiveStills(list, 1, 47, 'E')[0] ?? pickLiveStills(list, 1, 47, 'A')[0] ?? null
}

function catalogSquares(list: SponsorAd[]): SponsorAd[] {
  return liveCatalog(list).filter(isIabImageStill).filter(a => !isLeaderboardStill(a))
}

function catalogBanners(list: SponsorAd[]): SponsorAd[] {
  return liveCatalog(list).filter(isIabImageStill).filter(isLeaderboardStill)
}

function takeNextUnit(
  pool: SponsorAd[],
  prev: SponsorAd | null,
  usedIds: Set<string>,
): SponsorAd | null {
  const found = pool.find(ad => {
    if (!ad.id || usedIds.has(ad.id)) return false
    return !prev || !adsConflictAdjacent(prev, ad)
  })
  if (found?.id) usedIds.add(found.id)
  return found ?? null
}

/**
 * Media magazine feed. One sticky rail unit; remaining inventory walks
 * the story scroll one at a time. Destinations are the stored click_url.
 * Same advertiser never sits twice in a row. Leftover units are not dumped
 * as a footer pair.
 */
export function pickMediaFeedAds(list: SponsorAd[]): MediaFeedAds {
  const sidebar = takeSidebar(list)
  const pool = [...catalogBanners(list), ...catalogSquares(list)]
  let inFeed = cycleNonAdjacentAds(pool, MEDIA_IN_FEED_MAX)
  // Hero banner shares the first fold with the sticky rail.
  if (sidebar && inFeed[0] && adsConflictAdjacent(sidebar, inFeed[0])) {
    const swapAt = inFeed.findIndex((ad, i) => i > 0 && !adsConflictAdjacent(sidebar, ad))
    if (swapAt > 0) {
      const next = [...inFeed]
      const [moved] = next.splice(swapAt, 1)
      next.unshift(moved as SponsorAd)
      inFeed = next
    } else {
      inFeed = inFeed.slice(1)
    }
  }
  return { sidebar, inFeed }
}

/**
 * Article: rail may be a half-page; the story column gets a couple of
 * centered 300×250 squares. Same advertiser never twice in a row.
 */
export function pickArticleAds(list: SponsorAd[]): ArticleAds {
  const sidebar = takeSidebar(list)
  const sideKey = sidebar ? advertiserFamilyKey(sidebar) : ''
  // Sticky rail stays on screen, so the story column never repeats that brand.
  const squares = catalogSquares(list).filter(a => advertiserFamilyKey(a) !== sideKey)
  const extra = [...squares, ...catalogBanners(list).filter(a => advertiserFamilyKey(a) !== sideKey)]
  const inBody = cycleNonAdjacentAds(squares, ARTICLE_IN_BODY_MAX)
  const used = new Set(inBody.map(a => a.id).filter(Boolean) as string[])
  const related = takeNextUnit(extra, inBody[inBody.length - 1] ?? null, used)
  return { sidebar, inBody, related }
}

/** Lesson-thread inventory for all six Academy pillars — one unit per three cards. */
export function pickAcademyThreadAds(list: SponsorAd[]): SponsorAd[] {
  return cycleNonAdjacentAds(
    [...catalogSquares(list), ...catalogBanners(list)],
    ACADEMY_THREAD_IAB_MAX,
  )
}

/**
 * Home placements: mid-scroll singles, in-row 300×250/banners, end 300×600.
 * Sequence is adjacent-safe so the same advertiser is never twice in a row.
 */
export function pickHomePageAds(list: SponsorAd[]): HomePageAds {
  const mid = pickLiveStills(list, PAGE_IAB_MAX, 11)
  const used = new Set(mid.map(a => a.id).filter(Boolean) as string[])
  const inRowPool = [...pickLiveStills(list, 8, 13, 'A'), ...catalogBanners(list)]
  const endPool = pickLiveStills(list, 6, 71, 'E')

  let prev: SponsorAd | null = mid[mid.length - 1] ?? null
  const tileRow = takeNextUnit(inRowPool, prev, used)
  prev = tileRow ?? prev
  const episodeRow = takeNextUnit(inRowPool, prev, used)
  prev = episodeRow ?? prev
  const storyRow = takeNextUnit(inRowPool, prev, used)
  prev = storyRow ?? prev
  const endBox = takeNextUnit(endPool, prev, used)

  return { mid, tileRow, episodeRow, storyRow, endBox }
}

/** LIVE page stream: one unit between major sections, recycled with a gap. */
export function pickLivePageAds(list: SponsorAd[], count = LIVE_IAB_MAX): SponsorAd[] {
  const n = Math.min(LIVE_IAB_MAX, Math.max(1, count))
  const stills = catalogSquares(list)
  return cycleNonAdjacentAds(stills, n)
}

/** In-feed stream for Academy / LIVE — callers place units one at a time. */
export function pickAcademySponsors(list: SponsorAd[], count = 2): SponsorAd[] {
  const n = Math.min(IN_FEED_IAB_MAX, Math.max(1, count))
  return cycleNonAdjacentAds(pickLiveStills(list, Math.max(n, 8), 23), n)
}

/** Community feed — 300×250 squares AND 728×90 banners, spread advertisers. */
export function pickCommunityFeedAds(list: SponsorAd[], count = COMMUNITY_FEED_MAX): SponsorAd[] {
  const n = Math.min(COMMUNITY_FEED_MAX, Math.max(1, count))
  const banners = catalogBanners(list)
  const squares = catalogSquares(list)
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
  return cycleNonAdjacentAds(woven, n)
}

/** Home end-of-scroll 300×600 that does not repeat a mid-scroll advertiser. */
export function pickHomeEndBigBox(list: SponsorAd[], exclude: SponsorAd[] = []): SponsorAd | null {
  const excludeKeys = new Set(exclude.map(advertiserFamilyKey).filter(Boolean))
  const boxes = pickLiveStills(list, 4, 71, 'E').filter(
    a => !excludeKeys.has(advertiserFamilyKey(a)),
  )
  return boxes[0] ?? null
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
