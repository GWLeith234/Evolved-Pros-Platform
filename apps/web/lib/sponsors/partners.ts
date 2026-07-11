import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import {
  ADCELLERANT_AD_ID,
  ADCELLERANT_ASSETS,
  ADCELLERANT_SPONSOR_AD,
  ADCELLERANT_URL,
  isAdCellerantAd,
} from './adcellerant'

export { ADCELLERANT_AD_ID, ADCELLERANT_ASSETS, ADCELLERANT_SPONSOR_AD, ADCELLERANT_URL, isAdCellerantAd }

/** Fixed UUID for XPR Media seed + static fallback. */
export const XPR_MEDIA_AD_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'

export const XPR_MEDIA_ASSETS = {
  logo: '/sponsors/xpr-media/logo.svg',
} as const

export const XPR_MEDIA_URL = 'https://www.xpr.media/'

/**
 * XPR Media — content syndication & distribution platform.
 * Copy grounded in public positioning (1,000+ sites, PR/publisher reach).
 */
export const XPR_MEDIA_SPONSOR_AD: SponsorAd = {
  id: XPR_MEDIA_AD_ID,
  sponsor_name: 'XPR Media',
  tool_name: 'XPR Media',
  headline: 'Amplify Your Story Across 1,000+ Premium Sites',
  endorsement_quote: 'Content syndication that puts PR, publishers, and brands in front of the right audience — at scale.',
  cta_text: 'Expand Your Reach',
  image_url: XPR_MEDIA_ASSETS.logo,
  click_url: XPR_MEDIA_URL,
  link_url: XPR_MEDIA_URL,
}

export function isXprMediaAd(ad: Pick<SponsorAd, 'id' | 'sponsor_name' | 'tool_name'>): boolean {
  if (ad.id === XPR_MEDIA_AD_ID) return true
  const name = `${ad.sponsor_name ?? ''} ${ad.tool_name ?? ''}`.toLowerCase()
  return name.includes('xpr')
}

export type PremiumPartnerKind = 'adcellerant' | 'xpr' | null

export function premiumPartnerKind(
  ad: Pick<SponsorAd, 'id' | 'sponsor_name' | 'tool_name'>,
): PremiumPartnerKind {
  if (isAdCellerantAd(ad)) return 'adcellerant'
  if (isXprMediaAd(ad)) return 'xpr'
  return null
}

/** Default two-up for /home when DB has no active ads. */
export const DEFAULT_HOME_SPONSORS: SponsorAd[] = [
  ADCELLERANT_SPONSOR_AD,
  XPR_MEDIA_SPONSOR_AD,
]

/**
 * Ensure the two flagship Evolution Partners lead the home row.
 * Preserves any additional DB ads after the pair (capped by caller).
 */
export function ensureFlagshipSponsors(list: SponsorAd[]): SponsorAd[] {
  const byId = new Map(list.map(a => [a.id, a]))
  // Prefer DB row if present (allows admin override of copy/CTA), else static.
  const adc = list.find(isAdCellerantAd) ?? byId.get(ADCELLERANT_AD_ID) ?? ADCELLERANT_SPONSOR_AD
  const xpr = list.find(isXprMediaAd) ?? byId.get(XPR_MEDIA_AD_ID) ?? XPR_MEDIA_SPONSOR_AD
  const rest = list.filter(a => !isAdCellerantAd(a) && !isXprMediaAd(a))
  return [adc, xpr, ...rest]
}
