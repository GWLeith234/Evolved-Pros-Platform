import { describe, expect, it } from 'vitest'
import {
  adMatchesSurface,
  dedupeIabStillsBySponsor,
  filterLiveAds,
  iabClickHref,
  iabSlotPx,
  isAdScheduleLive,
  isBlockedLegacyAd,
  isIabImageStill,
  preferIabZone,
} from './iab'

const STILL = {
  id: '52e92e33-9896-4799-b6c8-bb744d0f3ad9',
  ad_type: 'image',
  title: 'Ad',
  sponsor_name: 'Transcend Clinic',
  tool_name: null,
  headline: null,
  cta_text: null,
  body_copy: null,
  image_url: 'https://example.com/transcend-300x250.png',
  click_url: 'https://transcendibogaine.com/?utm_source=house&utm_medium=display&utm_campaign=transcend&utm_content=300x250',
  link_url: null,
  zone: 'A',
  placement: 'sidebar',
  placements: ['platform'],
}

describe('isIabImageStill', () => {
  it('treats tonight’s Image rows (empty copy) as full stills', () => {
    expect(isIabImageStill(STILL)).toBe(true)
    expect(isIabImageStill({ ...STILL, sponsor_name: 'Evolved Pros Academy' })).toBe(true)
    expect(isIabImageStill({ ...STILL, sponsor_name: 'AdCellerant' })).toBe(true)
    expect(isIabImageStill({ ...STILL, sponsor_name: 'EvolveX360', zone: 'E' })).toBe(true)
  })

  it('does not treat text/logo partner or house copy units as stills', () => {
    expect(
      isIabImageStill({
        ...STILL,
        headline: 'Six Pillars. No Ceiling.',
        cta_text: 'Learn More',
      }),
    ).toBe(false)
    expect(
      isIabImageStill({
        ...STILL,
        headline: 'EVOLVED presale on now.',
        cta_text: 'Pre-order',
      }),
    ).toBe(false)
    expect(
      isIabImageStill({
        ad_type: 'native',
        image_url: '/logo.png',
        headline: null,
        cta_text: null,
        body_copy: null,
      }),
    ).toBe(false)
  })

  it('infers a still when ad_type is missing but the row is image-only + IAB', () => {
    expect(
      isIabImageStill({
        image_url: '/ads/partner-300x250.png',
        headline: null,
        cta_text: null,
        body_copy: null,
        zone: 'A',
      }),
    ).toBe(true)
  })
})

describe('iabSlotPx / iabClickHref', () => {
  it('keeps IAB aspect from zone and does not invent a destination', () => {
    expect(iabSlotPx(STILL)).toEqual({ w: 300, h: 250, slot: '300x250' })
    expect(iabSlotPx({ ...STILL, zone: 'C' })).toEqual({ w: 728, h: 90, slot: '728x90' })
    expect(iabSlotPx({ ...STILL, zone: 'E' })).toEqual({ w: 300, h: 600, slot: '300x600' })
    expect(iabClickHref(STILL)).toBe(STILL.click_url)
  })
})

describe('isAdScheduleLive', () => {
  it('matches admin: end_date wins over is_active', () => {
    expect(
      isAdScheduleLive({ is_active: true, end_date: '2026-08-31T00:00:00.000Z' }, Date.parse('2026-09-01T00:00:00.000Z')),
    ).toBe(false)
    expect(
      isAdScheduleLive({ is_active: true, end_date: null, start_date: null }, Date.parse('2026-09-01T00:00:00.000Z')),
    ).toBe(true)
    expect(isAdScheduleLive({ is_active: false }, Date.parse('2026-09-01T00:00:00.000Z'))).toBe(false)
  })
})

describe('isBlockedLegacyAd', () => {
  it('blocks the cancelled Amazon book / presale units', () => {
    expect(
      isBlockedLegacyAd({
        sponsor_name: 'Evolved — George Leith',
        tool_name: 'EVOLVED',
        headline: 'EVOLVED presale on now. Pre-order and get a free year of the Academy.',
        cta_text: 'Pre-order',
        click_url: 'https://www.amazon.ca/stores/author/B0GSLQSWJ8/about',
        image_url: '/ads/book-300x250.png',
      }),
    ).toBe(true)
    expect(isBlockedLegacyAd(STILL)).toBe(false)
    expect(
      isBlockedLegacyAd({
        id: ['a1b2c3d4', 'e5f6', '7890', 'abcd', 'ef1234567890'].join('-'),
        image_url: ['/sponsors/', 'adcellerant', '/logo-white', '.png'].join(''),
      }),
    ).toBe(true)
    expect(
      isBlockedLegacyAd({
        headline: ['#1 Largest Advertising', 'Agency in Denver'].join(' '),
        body_copy: ['Recognized by the Denver Business', 'Journal'].join(' '),
      }),
    ).toBe(true)
  })
})

describe('filter / surface / zone helpers', () => {
  it('filters expired book-style rows out of a mixed pool', () => {
    const live = filterLiveAds(
      [
        { ...STILL, is_active: true },
        { ...STILL, id: 'book', is_active: true, end_date: '2026-08-31T00:00:00.000Z' },
      ],
      Date.parse('2026-09-01T12:00:00.000Z'),
    )
    expect(live).toHaveLength(1)
    expect(live[0].id).toBe(STILL.id)
  })

  it('treats placements [platform] as eligible on every walked surface', () => {
    expect(adMatchesSurface(STILL, 'academy')).toBe(true)
    expect(adMatchesSurface(STILL, 'home')).toBe(true)
    expect(adMatchesSurface(STILL, 'community')).toBe(true)
    expect(adMatchesSurface(STILL, 'podcast')).toBe(true)
    expect(adMatchesSurface(STILL, 'media')).toBe(true)
    expect(adMatchesSurface(STILL, 'live')).toBe(true)
    expect(adMatchesSurface({ placements: ['media'], placement: 'sidebar' }, 'media')).toBe(true)
    expect(adMatchesSurface({ placements: ['media'] }, 'academy')).toBe(false)
  })

  it('dedupes A/C/E stills of the same sponsor, preferring zone A', () => {
    const out = dedupeIabStillsBySponsor([
      { ...STILL, id: 'e', zone: 'E', sponsor_name: 'Transcend Clinic' },
      { ...STILL, id: 'a', zone: 'A', sponsor_name: 'Transcend Clinic' },
      { ...STILL, id: 'c', zone: 'C', sponsor_name: 'Transcend Clinic' },
      { ...STILL, id: 'x', zone: 'A', sponsor_name: 'AdCellerant' },
    ])
    expect(out.map(a => a.id).sort()).toEqual(['a', 'x'])
  })

  it('preferIabZone falls back when that size is missing', () => {
    const onlyE = [{ ...STILL, zone: 'E' }]
    expect(preferIabZone(onlyE, 'A')).toEqual(onlyE)
    expect(preferIabZone([STILL, { ...STILL, zone: 'E' }], 'A')).toEqual([STILL])
  })
})
