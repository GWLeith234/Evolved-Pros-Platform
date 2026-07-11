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

/**
 * Official Vendasta branding (vendasta.com media logo SVG).
 * logo-white.svg: green leaf + white wordmark for dark heroes/cards.
 * logo-white.png / logo-wordmark.png: hi-res raster fallbacks.
 */
export const VENDASTA_ASSETS = {
  logoWhite: '/sponsors/vendasta/logo-white.svg',
  logoWhitePng: '/sponsors/vendasta/logo-white.png',
  logo: '/sponsors/vendasta/logo.svg',
  hero: '/sponsors/vendasta/hero-ai-workforce.svg',
  icon: '/sponsors/vendasta/icon.png',
  wordmark: '/sponsors/vendasta/logo-wordmark.png',
} as const

export const VENDASTA_URL = 'https://www.vendasta.com/'

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

/** Fixed UUID for EvolveX360 seed + static fallback. */
export const EVOLVEX360_AD_ID = 'd4e5f6a7-b8c9-0123-def0-234567890123'

export const EVOLVEX360_ASSETS = {
  logoWhite: '/sponsors/evolvex360/logo-white.svg',
  logo: '/sponsors/evolvex360/logo.svg',
  icon: '/sponsors/evolvex360/icon.png',
  hero: '/sponsors/evolvex360/hero-unlock.svg',
} as const

export const EVOLVEX360_URL = 'https://www.evolvex360.com/'

export const EVOLVEX360_LOCATIONS =
  'Reykjavik, Iceland · Denver, CO USA · Saskatoon & Regina, SK Canada · Durban, SA'

/**
 * EvolveX360 — AI solutions for business efficiency and growth.
 */
export const EVOLVEX360_SPONSOR_AD: SponsorAd = {
  id: EVOLVEX360_AD_ID,
  sponsor_name: 'EvolveX360',
  tool_name: 'EvolveX360',
  headline: 'Unlock the Future with AI Solutions from EvolveX360',
  endorsement_quote:
    'AI-powered business efficiency and growth — strategy, media, and execution that open new markets worldwide.',
  cta_text: 'Unlock AI Growth',
  image_url: EVOLVEX360_ASSETS.logoWhite,
  click_url: EVOLVEX360_URL,
  link_url: EVOLVEX360_URL,
}

export function isEvolveX360Ad(ad: Pick<SponsorAd, 'id' | 'sponsor_name' | 'tool_name'>): boolean {
  if (ad.id === EVOLVEX360_AD_ID) return true
  const name = `${ad.sponsor_name ?? ''} ${ad.tool_name ?? ''}`.toLowerCase().replace(/\s+/g, '')
  return name.includes('evolvex360') || name.includes('evolvex')
}

export type PremiumPartnerKind = 'adcellerant' | 'xpr' | 'vendasta' | 'evolvex360' | null

export function premiumPartnerKind(
  ad: Pick<SponsorAd, 'id' | 'sponsor_name' | 'tool_name'>,
): PremiumPartnerKind {
  if (isAdCellerantAd(ad)) return 'adcellerant'
  if (isVendastaAd(ad)) return 'vendasta'
  if (isEvolveX360Ad(ad)) return 'evolvex360'
  if (isXprMediaAd(ad)) return 'xpr'
  return null
}

/**
 * Full flagship catalog (community rail, academy, etc.).
 * Home main row uses `DEFAULT_HOME_SPONSORS` (exactly 2).
 */
export const ALL_FLAGSHIP_SPONSORS: SponsorAd[] = [
  ADCELLERANT_SPONSOR_AD,
  VENDASTA_SPONSOR_AD,
  EVOLVEX360_SPONSOR_AD,
  XPR_MEDIA_SPONSOR_AD,
]

/** Exactly two Evolution Partners for the /home main sponsor row. */
export const DEFAULT_HOME_SPONSORS: SponsorAd[] = [
  ADCELLERANT_SPONSOR_AD,
  VENDASTA_SPONSOR_AD,
]

/** 1–2 sponsors for Academy lesson footers (static fallback). */
export const DEFAULT_ACADEMY_SPONSORS: SponsorAd[] = [
  ADCELLERANT_SPONSOR_AD,
  EVOLVEX360_SPONSOR_AD,
]

/**
 * Ensure flagship Evolution Partners lead a sponsor list.
 * Order: AdCellerant → Vendasta → EvolveX360 → XPR Media → others.
 */
export function ensureFlagshipSponsors(list: SponsorAd[]): SponsorAd[] {
  const byId = new Map(list.map(a => [a.id, a]))
  const adc = list.find(isAdCellerantAd) ?? byId.get(ADCELLERANT_AD_ID) ?? ADCELLERANT_SPONSOR_AD
  const ven = list.find(isVendastaAd) ?? byId.get(VENDASTA_AD_ID) ?? VENDASTA_SPONSOR_AD
  const ex = list.find(isEvolveX360Ad) ?? byId.get(EVOLVEX360_AD_ID) ?? EVOLVEX360_SPONSOR_AD
  const xpr = list.find(isXprMediaAd) ?? byId.get(XPR_MEDIA_AD_ID) ?? XPR_MEDIA_SPONSOR_AD
  const rest = list.filter(
    a => !isAdCellerantAd(a) && !isVendastaAd(a) && !isEvolveX360Ad(a) && !isXprMediaAd(a),
  )
  return [adc, ven, ex, xpr, ...rest]
}

/** Exactly two sponsors for /home main row. */
export function pickHomeSponsors(list: SponsorAd[]): SponsorAd[] {
  return ensureFlagshipSponsors(list).slice(0, 2)
}

/** One or two sponsors for Academy lesson pages. */
export function pickAcademySponsors(list: SponsorAd[], count = 2): SponsorAd[] {
  const n = Math.min(2, Math.max(1, count))
  const flagged = ensureFlagshipSponsors(list)
  return flagged.slice(0, n)
}
