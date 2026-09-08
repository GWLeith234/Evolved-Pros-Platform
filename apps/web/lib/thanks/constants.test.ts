import { describe, expect, it } from 'vitest'
import {
  FOG_CLAIM_PATH_LOCK,
  FOG_PROMO_CODE_LOCK,
  THANKS_CADENCE_OFFSET_DAYS,
  THANKS_CADENCE_STEPS,
  THANKS_CLAIM_PATH,
  THANKS_E01_STEP,
  THANKS_EXPIRY_DAYS,
  THANKS_GRANTS_TIER,
  THANKS_PROMO_CODE,
  THANKS_TEMPLATE_IDS,
  THANKS_TERMINAL_STEP,
  THANKS_TIER_STATUS,
  THANKS_WWW_ORIGIN,
  parseThanksCadenceStep,
  thanksCadenceLabel,
  thanksEmailCode,
  thanksTemplateId,
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

  it('locks cadence to 12 steps over 56 days and 90-day expiry', () => {
    expect([...THANKS_CADENCE_STEPS]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    expect(THANKS_E01_STEP).toBe(0)
    expect(THANKS_TERMINAL_STEP).toBe(11)
    expect(THANKS_EXPIRY_DAYS).toBe(90)
    expect(THANKS_CADENCE_OFFSET_DAYS).toEqual({
      0: 0,
      1: 3,
      2: 6,
      3: 9,
      4: 12,
      5: 16,
      6: 20,
      7: 24,
      8: 28,
      9: 35,
      10: 42,
      11: 56,
    })
  })

  it('names Resend templates ep-community-thanks-e01 through e12', () => {
    expect(THANKS_TEMPLATE_IDS).toEqual({
      0: 'ep-community-thanks-e01',
      1: 'ep-community-thanks-e02',
      2: 'ep-community-thanks-e03',
      3: 'ep-community-thanks-e04',
      4: 'ep-community-thanks-e05',
      5: 'ep-community-thanks-e06',
      6: 'ep-community-thanks-e07',
      7: 'ep-community-thanks-e08',
      8: 'ep-community-thanks-e09',
      9: 'ep-community-thanks-e10',
      10: 'ep-community-thanks-e11',
      11: 'ep-community-thanks-e12',
    })
    expect(thanksTemplateId(0)).toBe('ep-community-thanks-e01')
    expect(thanksEmailCode(11)).toBe('e12')
    expect(thanksCadenceLabel(0)).toBe('E01 D0')
    expect(thanksCadenceLabel(11)).toBe('E12 D56')
  })

  it('parses integer cadence steps 0-11 and rejects the old d0/d7 labels', () => {
    expect(parseThanksCadenceStep(0)).toBe(0)
    expect(parseThanksCadenceStep('11')).toBe(11)
    expect(parseThanksCadenceStep(12)).toBeNull()
    expect(parseThanksCadenceStep('d0')).toBeNull()
    expect(parseThanksCadenceStep('d28')).toBeNull()
  })
})
