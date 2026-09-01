import { describe, expect, it } from 'vitest'
import { houseAdHref } from '@/lib/ads/house'
import {
  ACADEMY_SPONSOR_AD,
  ACADEMY_UPGRADE_AD,
  ensurePodcastSponsors,
  isAcademyAd,
  pickAcademySponsors,
  pickHomeSponsors,
} from './partners'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

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
    expect(
      isAcademyAd({
        id: 'adc-live',
        sponsor_name: 'AdCellerant',
        tool_name: null,
        image_url: 'https://example.com/adc.png',
        click_url: 'https://www.adcellerant.com/',
        link_url: null,
      }),
    ).toBe(false)
    expect(
      isAcademyAd({
        id: 'evx-live',
        sponsor_name: 'EvolveX360',
        tool_name: null,
        image_url: 'https://example.com/evx.png',
        click_url: 'https://evolvex360.com/',
        link_url: null,
      }),
    ).toBe(false)
  })

  it('serves live IAB stills and never invents fallback cards', () => {
    const stills: SponsorAd[] = [
      {
        id: 'adc-a',
        sponsor_name: 'AdCellerant',
        tool_name: null,
        headline: null,
        cta_text: null,
        endorsement_quote: null,
        image_url: 'https://example.com/adc-300x250.png',
        click_url: 'https://www.adcellerant.com/?utm_content=300x250',
        link_url: null,
        ad_type: 'image',
        title: 'Ad',
        zone: 'A',
      },
      {
        id: 'aca-a',
        sponsor_name: 'Evolved Pros Academy',
        tool_name: null,
        headline: null,
        cta_text: null,
        endorsement_quote: null,
        image_url: 'https://example.com/aca-300x250.png',
        click_url: 'https://www.evolvedpros.com/pricing?utm_content=300x250',
        link_url: null,
        ad_type: 'image',
        title: 'Ad',
        zone: 'A',
      },
      {
        id: 'tr-a',
        sponsor_name: 'Transcend Clinic',
        tool_name: null,
        headline: null,
        cta_text: null,
        endorsement_quote: null,
        image_url: 'https://example.com/tr-300x250.png',
        click_url: 'https://transcendibogaine.com/?utm_content=300x250',
        link_url: null,
        ad_type: 'image',
        title: 'Ad',
        zone: 'A',
      },
      {
        id: 'evx-a',
        sponsor_name: 'EvolveX360',
        tool_name: null,
        headline: null,
        cta_text: null,
        endorsement_quote: null,
        image_url: 'https://example.com/evx-300x250.png',
        click_url: 'https://evolvex360.com/?utm_content=300x250',
        link_url: null,
        ad_type: 'image',
        title: 'Ad',
        zone: 'A',
      },
    ]
    const home = pickHomeSponsors(stills)
    expect(home).toHaveLength(4)
    expect(home.every(a => a.title === 'Ad' && !a.headline && !a.cta_text)).toBe(true)
    expect(home.map(a => a.sponsor_name).sort()).toEqual([
      'AdCellerant',
      'EvolveX360',
      'Evolved Pros Academy',
      'Transcend Clinic',
    ])
    expect(pickHomeSponsors([ACADEMY_SPONSOR_AD])).toEqual([])
    expect(ensurePodcastSponsors([])).toEqual([])
    expect(pickAcademySponsors([], 2)).toEqual([])
    expect(
      pickAcademySponsors(
        [
          {
            ...stills[2],
            zone: 'C',
            click_url: 'https://transcendibogaine.com/?utm_content=728x90',
          },
        ],
        2,
      ),
    ).toEqual([])
    const mixed = pickHomeSponsors([
      ...stills,
      { ...stills[2], id: 'tr-c', zone: 'C', click_url: 'https://transcendibogaine.com/?utm_content=728x90' },
    ])
    expect(mixed.every(a => a.zone === 'A')).toBe(true)
    expect(mixed.filter(a => a.sponsor_name === 'Transcend Clinic')).toHaveLength(1)
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
