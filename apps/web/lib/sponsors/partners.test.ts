import { describe, expect, it } from 'vitest'
import { houseAdHref } from '@/lib/ads/house'
import {
  ACADEMY_SPONSOR_AD,
  ACADEMY_UPGRADE_AD,
  ADCELLERANT_SPONSOR_AD,
  EVOLVEX360_SPONSOR_AD,
  XPR_MEDIA_SPONSOR_AD,
  isAcademyAd,
} from './partners'

const HOUSE = houseAdHref('300x250')

describe('ACADEMY_* fallback destinations', () => {
  it('points both hardcoded house units at /pricing with house UTMs', () => {
    expect(ACADEMY_SPONSOR_AD.click_url).toBe(HOUSE)
    expect(ACADEMY_SPONSOR_AD.link_url).toBe(HOUSE)
    expect(ACADEMY_UPGRADE_AD.click_url).toBe(HOUSE)
    expect(ACADEMY_UPGRADE_AD.link_url).toBe(HOUSE)
    for (const url of [ACADEMY_SPONSOR_AD.click_url, ACADEMY_UPGRADE_AD.click_url]) {
      expect(url).not.toContain('/join')
      expect(url).not.toContain('/academy')
      expect(url).not.toContain('/membership')
    }
  })
})

describe('isAcademyAd', () => {
  it('recognizes hardcoded house units and partner units stay partners', () => {
    expect(isAcademyAd(ACADEMY_SPONSOR_AD)).toBe(true)
    expect(isAcademyAd(ACADEMY_UPGRADE_AD)).toBe(true)
    expect(isAcademyAd(ADCELLERANT_SPONSOR_AD)).toBe(false)
    expect(isAcademyAd(EVOLVEX360_SPONSOR_AD)).toBe(false)
    expect(isAcademyAd(XPR_MEDIA_SPONSOR_AD)).toBe(false)
  })

  it('treats a platform_ads row with house UTMs as Academy self-promo', () => {
    expect(
      isAcademyAd({
        id: '00000000-0000-4000-8000-000000000099',
        sponsor_name: 'Evolved Pros',
        tool_name: null,
        image_url: '/ads/academy-300x600.png',
        click_url: houseAdHref('300x600'),
        link_url: houseAdHref('300x600'),
      }),
    ).toBe(true)
  })
})
