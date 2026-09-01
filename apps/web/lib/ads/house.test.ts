import { describe, expect, it } from 'vitest'
import {
  HOUSE_AD_SLOTS,
  HOUSE_PROMOTION_NAME,
  houseAdEventParams,
  houseAdHref,
  inferHouseAdSlot,
  isHouseAdSlot,
  resolveServedAdHref,
} from './house'

describe('houseAdHref', () => {
  it.each(HOUSE_AD_SLOTS)('locks %s to /pricing with house UTMs', slot => {
    const href = houseAdHref(slot)
    expect(href.startsWith('/pricing?')).toBe(true)
    expect(href).not.toContain('/join')
    expect(href).not.toContain('/academy')
    expect(href).not.toContain('/membership')
    const q = new URL(href, 'https://platform.evolvedpros.com').searchParams
    expect(q.get('utm_source')).toBe('house')
    expect(q.get('utm_medium')).toBe('display')
    expect(q.get('utm_campaign')).toBe('academy')
    expect(q.get('utm_content')).toBe(slot)
  })
})

describe('inferHouseAdSlot', () => {
  it('prefers an explicit IAB hint', () => {
    expect(inferHouseAdSlot({ zone: 'A' }, '300x600')).toBe('300x600')
  })

  it('maps zone letters A / C / E', () => {
    expect(inferHouseAdSlot({ zone: 'A' })).toBe('300x250')
    expect(inferHouseAdSlot({ zone: 'c' })).toBe('728x90')
    expect(inferHouseAdSlot({ zone: 'E' })).toBe('300x600')
  })

  it('reads size from the creative filename', () => {
    expect(inferHouseAdSlot({ image_url: '/ads/academy-728x90.png' })).toBe('728x90')
    expect(inferHouseAdSlot({ image_url: '/ads/academy-300x600.png' })).toBe('300x600')
    expect(inferHouseAdSlot({ image_url: '/ads/academy-300x250.png' })).toBe('300x250')
  })

  it('defaults portrait / architecture cards to 300x250', () => {
    expect(inferHouseAdSlot({ image_url: '/ads/academy-portrait.png' })).toBe('300x250')
    expect(inferHouseAdSlot({})).toBe('300x250')
  })

  it('rejects unknown hints', () => {
    expect(isHouseAdSlot('300x50')).toBe(false)
    expect(inferHouseAdSlot({ zone: 'B' }, 'not-a-slot')).toBe('300x250')
  })
})

describe('houseAdEventParams', () => {
  it('emits the GA4 param set Data should look for', () => {
    const params = houseAdEventParams(
      {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        headline: 'Stop collecting tips. Build the system.',
        zone: 'E',
      },
      { locationId: '/media/story' },
    )
    expect(params).toEqual({
      creative_name: 'Stop collecting tips. Build the system.',
      creative_slot: '300x600',
      promotion_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      promotion_name: HOUSE_PROMOTION_NAME,
      location_id: '/media/story',
    })
    expect(params.promotion_name).toBe('academy_house')
  })
})

describe('resolveServedAdHref', () => {
  it('rewrites house ads even when the row still points at /academy', () => {
    expect(
      resolveServedAdHref(
        { click_url: '/academy', image_url: '/ads/academy-300x250.png' },
        true,
      ),
    ).toBe(houseAdHref('300x250'))
  })

  it('leaves partner destinations alone', () => {
    expect(
      resolveServedAdHref({ click_url: 'https://www.adcellerant.com/' }, false),
    ).toBe('https://www.adcellerant.com/')
  })
})
