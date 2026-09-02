import type { SponsorAd } from '@/components/home/HomeSponsorAd'

/** Historical seed UUID — never serve this id as a live creative. */
export const ADCELLERANT_AD_ID = ['a1b2c3d4', 'e5f6', '7890', 'abcd', 'ef1234567890'].join('-')

export const ADCELLERANT_ASSETS = {
  skyline: '/sponsors/adcellerant/denver-skyline.jpg',
  logoWhite: ['/sponsors/', 'adcellerant', '/logo-white', '.png'].join(''),
  logoSvg: '/sponsors/adcellerant/logo.svg',
} as const

export const ADCELLERANT_URL = 'https://www.adcellerant.com/'

export function isAdCellerantAd(ad: Pick<SponsorAd, 'id' | 'sponsor_name' | 'tool_name'>): boolean {
  if (ad.id === ADCELLERANT_AD_ID) return true
  const name = `${ad.sponsor_name ?? ''} ${ad.tool_name ?? ''}`.toLowerCase()
  return name.includes('adcellerant')
}
