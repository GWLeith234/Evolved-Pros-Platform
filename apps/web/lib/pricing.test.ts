import { describe, it, expect } from 'vitest'
import { computeMrr, tierMonthlyPrice, isRevenueMember } from './pricing'

describe('revenue hygiene — guests never count as revenue', () => {
  it('a comped guest Pro contributes $0 MRR', () => {
    // The guest persona: tier='pro', tier_status='comp', role='guest', no sub.
    expect(tierMonthlyPrice('pro', 'comp')).toBe(0)
    expect(
      computeMrr([{ tier: 'pro', tier_status: 'comp', role: 'guest' }]),
    ).toBe(0)
  })

  it('role=guest is excluded even if tier_status somehow reads active', () => {
    expect(
      computeMrr([{ tier: 'pro', tier_status: 'active', role: 'guest' }]),
    ).toBe(0)
    expect(isRevenueMember({ tier: 'pro', tier_status: 'active', role: 'guest' })).toBe(false)
  })

  it('a real paying Pro still counts', () => {
    expect(tierMonthlyPrice('pro', 'active')).toBe(249)
    expect(
      computeMrr([{ tier: 'pro', tier_status: 'active', role: 'member' }]),
    ).toBe(249)
    expect(isRevenueMember({ tier: 'pro', tier_status: 'active', role: 'member' })).toBe(true)
  })

  it('comp_promo_code_id comps still excluded (unchanged)', () => {
    expect(
      computeMrr([{ tier: 'pro', tier_status: 'active', comp_promo_code_id: 'x' }]),
    ).toBe(0)
  })

  it('cancelled / expired remain $0', () => {
    expect(tierMonthlyPrice('pro', 'cancelled')).toBe(0)
    expect(tierMonthlyPrice('pro', 'expired')).toBe(0)
  })

  it('mixed roster sums only real payers', () => {
    const roster = [
      { tier: 'pro', tier_status: 'active', role: 'member' },   // 249
      { tier: 'vip', tier_status: 'active', role: 'member' },   // 49
      { tier: 'pro', tier_status: 'comp', role: 'guest' },      // 0
      { tier: 'pro', tier_status: 'active', comp_promo_code_id: 'c' }, // 0
    ]
    expect(computeMrr(roster)).toBe(298)
  })
})
