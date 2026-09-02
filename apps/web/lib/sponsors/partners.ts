import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { houseAdHref } from '@/lib/ads/house'
import {
  cardSafeIabStills,
  isBlockedLegacyAd,
  isIabImageStill,
} from '@/lib/ads/iab'
import { dedupeSponsors, pickRotatedSponsors, sponsorKey } from './rotate'

function liveCatalog(list: SponsorAd[]): SponsorAd[] {
  return list.filter(a => !isRetiredPartnerAd(a) && !isBlockedLegacyAd(a))
}

function pickLiveStills(list: SponsorAd[], count: number, salt: number): SponsorAd[] {
  const stills = cardSafeIabStills(liveCatalog(list), 'A')
  if (!stills.length) return []
  return pickRotatedSponsors(stills, count, { salt })
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
 * Podcast archive pool: Academy promo first, then Evolution Partners.
 * Never falls back to unrelated placements (community banners, etc.).
 */
export function ensurePodcastSponsors(list: SponsorAd[]): SponsorAd[] {
  const stills = pickLiveStills(list, 4, 17)
  if (stills.length) return stills
  return []
}

/** Exactly two sponsors for /home main row — daily rotation, no dups.
 *  Home stays Evolution Partners only (no Academy self-promo in that row). */
export function pickHomeSponsors(list: SponsorAd[]): SponsorAd[] {
  // Today's four accounts (ADC / Academy / Transcend / EVX), zone-A stills.
  return pickLiveStills(list, 4, 11)
}

/** One or two slots for Academy / LIVE — Academy promo first, then a partner. */
export function pickAcademySponsors(list: SponsorAd[], count = 2): SponsorAd[] {
  const n = Math.min(4, Math.max(1, count))
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
