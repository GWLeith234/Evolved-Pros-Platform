import { afterEach, describe, expect, it } from 'vitest'
import { configuredPriceIdsForTier, tierForPriceId } from './config'

const NAMES = [
  'STRIPE_PRICE_VIP_MONTHLY_149',
  'STRIPE_PRICE_PRO_MONTHLY_599',
  'STRIPE_PRICE_VIP_MONTHLY',
  'STRIPE_PRICE_VIP_MONTHLY_99',
  'STRIPE_PRICE_VIP_MONTHLY_49',
  'STRIPE_PRICE_VIP_ANNUAL',
  'STRIPE_PRICE_VIP_ANNUAL_490',
  'STRIPE_PRICE_PRO_MONTHLY',
  'STRIPE_PRICE_PRO_MONTHLY_849',
  'STRIPE_PRICE_PRO_MONTHLY_249',
  'STRIPE_PRICE_PRO_ANNUAL',
  'STRIPE_PRICE_PRO_ANNUAL_2490',
] as const

const PREV = new Map<string, string | undefined>()

afterEach(() => {
  for (const name of NAMES) {
    const prev = PREV.get(name)
    if (prev === undefined) delete process.env[name]
    else process.env[name] = prev
  }
  PREV.clear()
})

function setPrice(name: string, id: string) {
  if (!PREV.has(name)) PREV.set(name, process.env[name])
  process.env[name] = id
}

describe('tierForPriceId', () => {
  it('maps the new monthly prices and every legacy price to a tier', () => {
    setPrice('STRIPE_PRICE_VIP_MONTHLY_149', 'price_vip_149')
    setPrice('STRIPE_PRICE_PRO_MONTHLY_599', 'price_pro_599')
    setPrice('STRIPE_PRICE_VIP_MONTHLY', 'price_vip_99')
    setPrice('STRIPE_PRICE_VIP_MONTHLY_99', 'price_vip_99_alias')
    setPrice('STRIPE_PRICE_VIP_MONTHLY_49', 'price_vip_49')
    setPrice('STRIPE_PRICE_VIP_ANNUAL', 'price_vip_490')
    setPrice('STRIPE_PRICE_VIP_ANNUAL_490', 'price_vip_490_alias')
    setPrice('STRIPE_PRICE_PRO_MONTHLY', 'price_pro_849')
    setPrice('STRIPE_PRICE_PRO_MONTHLY_849', 'price_pro_849_alias')
    setPrice('STRIPE_PRICE_PRO_MONTHLY_249', 'price_pro_249')
    setPrice('STRIPE_PRICE_PRO_ANNUAL', 'price_pro_2490')
    setPrice('STRIPE_PRICE_PRO_ANNUAL_2490', 'price_pro_2490_alias')

    expect(tierForPriceId('price_vip_149')).toBe('vip')
    expect(tierForPriceId('price_pro_599')).toBe('pro')
    expect(tierForPriceId('price_vip_99')).toBe('vip')
    expect(tierForPriceId('price_vip_99_alias')).toBe('vip')
    expect(tierForPriceId('price_vip_49')).toBe('vip')
    expect(tierForPriceId('price_vip_490')).toBe('vip')
    expect(tierForPriceId('price_vip_490_alias')).toBe('vip')
    expect(tierForPriceId('price_pro_849')).toBe('pro')
    expect(tierForPriceId('price_pro_849_alias')).toBe('pro')
    expect(tierForPriceId('price_pro_249')).toBe('pro')
    expect(tierForPriceId('price_pro_2490')).toBe('pro')
    expect(tierForPriceId('price_pro_2490_alias')).toBe('pro')
    expect(tierForPriceId('price_unknown')).toBeNull()
  })
})

describe('configuredPriceIdsForTier', () => {
  it('includes the new price and legacy prices so old subscribers count toward the cap', () => {
    setPrice('STRIPE_PRICE_PRO_MONTHLY_599', 'price_pro_599')
    setPrice('STRIPE_PRICE_PRO_MONTHLY', 'price_pro_849')
    setPrice('STRIPE_PRICE_PRO_MONTHLY_249', 'price_pro_249')
    setPrice('STRIPE_PRICE_VIP_MONTHLY_149', 'price_vip_149')

    expect(configuredPriceIdsForTier('pro')).toEqual(expect.arrayContaining([
      'price_pro_599',
      'price_pro_849',
      'price_pro_249',
    ]))
    expect(configuredPriceIdsForTier('pro')).not.toContain('price_vip_149')
    expect(configuredPriceIdsForTier('community')).toEqual([])
  })
})
