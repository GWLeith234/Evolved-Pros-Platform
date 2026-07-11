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

export const XPR_MEDIA_SPONSOR_AD: SponsorAd = {
  id: XPR_MEDIA_AD_ID,
  sponsor_name: 'XPR Media',
  tool_name: 'XPR Media',
  headline: 'Amplify Your Story Across 1,000+ Premium Sites',
  endorsement_quote:
    'Content syndication that puts PR, publishers, and brands in front of the right audience — at scale.',
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

/** Fixed UUID for Vendasta seed + static fallback. */
export const VENDASTA_AD_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012'

export const VENDASTA_ASSETS = {
  logoWhite: '/sponsors/vendasta/logo-white.svg',
  hero: '/sponsors/vendasta/hero-ai-workforce.svg',
  icon: '/sponsors/vendasta/icon.png',
  wordmark: '/sponsors/vendasta/logo-wordmark.png',
} as const

export const VENDASTA_URL = 'https://www.vendasta.com/'

/**
 * Vendasta — AI Workforce for local businesses.
 * Copy mirrors the official AI Workforce creative tone.
 */
export const VENDASTA_SPONSOR_AD: SponsorAd = {
  id: VENDASTA_AD_ID,
  sponsor_name: 'Vendasta',
  tool_name: 'Vendasta',
  headline: 'Meet the AI Workforce for local businesses',
  endorsement_quote:
    'Boost more traffic, capture more leads, and grow revenue with AI employees that work 24/7.',
  cta_text: 'Get a demo',
  image_url: VENDASTA_ASSETS.logoWhite,
  click_url: VENDASTA_URL,
  link_url: VENDASTA_URL,
}

export function isVendastaAd(ad: Pick<SponsorAd, 'id' | 'sponsor_name' | 'tool_name'>): boolean {
  if (ad.id === VENDASTA_AD_ID) return true
  const name = `${ad.sponsor_name ?? ''} ${ad.tool_name ?? ''}`.toLowerCase()
  return name.includes('vendasta')
}

export type PremiumPartnerKind = 'adcellerant' | 'xpr' | 'vendasta' | null

export function premiumPartnerKind(
  ad: Pick<SponsorAd, 'id' | 'sponsor_name' | 'tool_name'>,
): PremiumPartnerKind {
  if (isAdCellerantAd(ad)) return 'adcellerant'
  if (isXprMediaAd(ad)) return 'xpr'
  if (isVendastaAd(ad)) return 'vendasta'
  return null
}

/** Default flagship row when DB has no active ads. */
export const DEFAULT_HOME_SPONSORS: SponsorAd[] = [
  ADCELLERANT_SPONSOR_AD,
  VENDASTA_SPONSOR_AD,
  XPR_MEDIA_SPONSOR_AD,
]

/**
 * Ensure flagship Evolution Partners lead the home row.
 * Order: AdCellerant → Vendasta → XPR Media → other active ads.
 */
export function ensureFlagshipSponsors(list: SponsorAd[]): SponsorAd[] {
  const byId = new Map(list.map(a => [a.id, a]))
  const adc = list.find(isAdCellerantAd) ?? byId.get(ADCELLERANT_AD_ID) ?? ADCELLERANT_SPONSOR_AD
  const ven = list.find(isVendastaAd) ?? byId.get(VENDASTA_AD_ID) ?? VENDASTA_SPONSOR_AD
  const xpr = list.find(isXprMediaAd) ?? byId.get(XPR_MEDIA_AD_ID) ?? XPR_MEDIA_SPONSOR_AD
  const rest = list.filter(a => !isAdCellerantAd(a) && !isVendastaAd(a) && !isXprMediaAd(a))
  return [adc, ven, xpr, ...rest]
}
