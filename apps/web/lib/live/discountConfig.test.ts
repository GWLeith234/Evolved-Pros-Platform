import { afterEach, describe, expect, it } from 'vitest'
import {
  LIVE_DISCOUNT_PCT_DEFAULTS,
  discountedTicketCents,
  liveDiscountPercent,
} from './discountConfig'

describe('LIVE_DISCOUNT_PCT placeholder', () => {
  afterEach(() => {
    delete process.env.LIVE_DISCOUNT_PCT_COMMUNITY
    delete process.env.LIVE_DISCOUNT_PCT_VIP
    delete process.env.LIVE_DISCOUNT_PCT_PRO
  })

  it('defaults to 0 / 10 / 20 and 0 when logged out', () => {
    expect(LIVE_DISCOUNT_PCT_DEFAULTS).toEqual({ community: 0, vip: 10, pro: 20 })
    expect(liveDiscountPercent('community')).toBe(0)
    expect(liveDiscountPercent('vip')).toBe(10)
    expect(liveDiscountPercent('pro')).toBe(20)
    expect(liveDiscountPercent('professional')).toBe(20)
    expect(liveDiscountPercent(null)).toBe(0)
    expect(liveDiscountPercent(undefined)).toBe(0)
    expect(liveDiscountPercent('')).toBe(0)
  })

  it('reads env so George can change the percent without a code edit', () => {
    process.env.LIVE_DISCOUNT_PCT_VIP = '15'
    process.env.LIVE_DISCOUNT_PCT_PRO = '25'
    expect(liveDiscountPercent('vip')).toBe(15)
    expect(liveDiscountPercent('pro')).toBe(25)
    expect(discountedTicketCents(50000, liveDiscountPercent('vip'))).toBe(42500)
  })

  it('keeps a logged-out buyer at 0 even if the community placeholder changes', () => {
    process.env.LIVE_DISCOUNT_PCT_COMMUNITY = '40'
    expect(liveDiscountPercent('community')).toBe(40)
    expect(liveDiscountPercent(null)).toBe(0)
    expect(discountedTicketCents(50000, liveDiscountPercent(null))).toBe(50000)
  })
})
