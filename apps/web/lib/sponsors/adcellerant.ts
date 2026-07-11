import type { SponsorAd } from '@/components/home/HomeSponsorAd'

/** Fixed UUID so seeds + static fallback share one identity. */
export const ADCELLERANT_AD_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

/** Public paths for AdCellerant Evolution Partner creatives. */
export const ADCELLERANT_ASSETS = {
  skyline: '/sponsors/adcellerant/denver-skyline.jpg',
  logoWhite: '/sponsors/adcellerant/logo-white.png',
  logoSvg: '/sponsors/adcellerant/logo.svg',
} as const

export const ADCELLERANT_URL = 'https://www.adcellerant.com/'

/**
 * Canonical AdCellerant platform_ad shape used as a static fallback when
 * the DB seed has not been applied, and as the source of truth for copy.
 */
export const ADCELLERANT_SPONSOR_AD: SponsorAd = {
  id: ADCELLERANT_AD_ID,
  sponsor_name: 'AdCellerant',
  tool_name: 'AdCellerant',
  headline: '#1 Largest Advertising Agency in Denver',
  endorsement_quote: 'Recognized by the Denver Business Journal',
  cta_text: 'Partner with Us',
  // Logo mark for compact placements; skyline used by the premium card layout
  image_url: ADCELLERANT_ASSETS.logoWhite,
  click_url: ADCELLERANT_URL,
  link_url: ADCELLERANT_URL,
}

export function isAdCellerantAd(ad: Pick<SponsorAd, 'id' | 'sponsor_name' | 'tool_name'>): boolean {
  if (ad.id === ADCELLERANT_AD_ID) return true
  const name = `${ad.sponsor_name ?? ''} ${ad.tool_name ?? ''}`.toLowerCase()
  return name.includes('adcellerant')
}
