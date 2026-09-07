import { describe, expect, it } from 'vitest'
import {
  FOG_CLAIM_PATH_LOCK,
  FOG_PROMO_CODE_LOCK,
  THANKS_CADENCE_STEPS,
  THANKS_CLAIM_PATH,
  THANKS_EXPIRY_DAYS,
  THANKS_GRANTS_TIER,
  THANKS_PROMO_CODE,
  THANKS_TEMPLATE_IDS,
  THANKS_TIER_STATUS,
  THANKS_WWW_ORIGIN,
} from './constants'

describe('thank-you Community hard locks', () => {
  it('uses THANKS_COMMUNITY and never FRIENDSOFGEORGE', () => {
    expect(THANKS_PROMO_CODE).toBe('THANKS_COMMUNITY')
    expect(THANKS_PROMO_CODE).not.toBe(FOG_PROMO_CODE_LOCK)
    expect(FOG_PROMO_CODE_LOCK).toBe('FRIENDSOFGEORGE')
  })

  it('grants community + active only', () => {
    expect(THANKS_GRANTS_TIER).toBe('community')
    expect(THANKS_TIER_STATUS).toBe('active')
    expect(THANKS_GRANTS_TIER).not.toBe('pro')
    expect(THANKS_GRANTS_TIER).not.toBe('vip')
  })

  it('claims on www /invite/thanks and leaves FOG on /welcome', () => {
    expect(THANKS_CLAIM_PATH).toBe('/invite/thanks')
    expect(THANKS_WWW_ORIGIN).toBe('https://www.evolvedpros.com')
    expect(FOG_CLAIM_PATH_LOCK).toBe('/welcome')
    expect(THANKS_CLAIM_PATH).not.toBe(FOG_CLAIM_PATH_LOCK)
  })

  it('locks cadence to D0/D7/D14/D28 and 90-day expiry', () => {
    expect([...THANKS_CADENCE_STEPS]).toEqual(['d0', 'd7', 'd14', 'd28'])
    expect(THANKS_EXPIRY_DAYS).toBe(90)
  })

  it('names Resend templates ep-community-thanks-*', () => {
    expect(THANKS_TEMPLATE_IDS).toEqual({
      d0: 'ep-community-thanks-d0',
      d7: 'ep-community-thanks-d7',
      d14: 'ep-community-thanks-d14',
      d28: 'ep-community-thanks-d28',
    })
  })
})
