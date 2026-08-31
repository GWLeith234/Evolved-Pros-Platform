import { describe, it, expect } from 'vitest'
import { computeMrr, tierMonthlyPrice, isRevenueMember, pricingLadderState, planAmountCents, TIERS, type LadderTier } from './pricing'
import { hasTierAccess, effectiveTier } from './tier'

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

describe('pricingLadderState — current-plan marking (SPRINT PRICE-1)', () => {
  // Uses the real hasTierAccess so the test exercises the shared rank table.
  const state = (current: string | null, card: LadderTier | null) =>
    pricingLadderState(current, card, hasTierAccess)

  it('shows live CTAs on every card for an anonymous visitor', () => {
    expect(state(null, 'community')).toBeNull()
    expect(state(null, 'vip')).toBeNull()
    expect(state(null, 'pro')).toBeNull()
  })

  it('marks Community as owned for a free member, upgrades stay live', () => {
    expect(state('community', 'community')).toBe('owned')
    expect(state('community', 'vip')).toBeNull()
    expect(state('community', 'pro')).toBeNull()
  })

  it('marks VIP as owned, Community as included, Pro still buyable', () => {
    expect(state('vip', 'community')).toBe('below')
    expect(state('vip', 'vip')).toBe('owned')
    expect(state('vip', 'pro')).toBeNull()
  })

  it('marks Pro as owned and everything under it as included', () => {
    expect(state('pro', 'community')).toBe('below')
    expect(state('pro', 'vip')).toBe('below')
    expect(state('pro', 'pro')).toBe('owned')
  })

  it('never marks a non-ladder card (Keynotes) as owned', () => {
    expect(state('pro', null)).toBeNull()
  })

  it('is case-insensitive on the viewer tier', () => {
    expect(state('VIP', 'vip')).toBe('owned')
  })

  it('treats an unrecognised tier as no entitlement — CTAs stay live', () => {
    expect(state('legacy-gold', 'vip')).toBeNull()
  })
})

describe('planAmountCents — checkout amounts match the catalogue', () => {
  it('uses the canonical $49 / $249 ladder, not the legacy $79 VIP', () => {
    expect(planAmountCents('vip_monthly')).toBe(4900)
    expect(planAmountCents('vip_annual')).toBe(49000)
    expect(planAmountCents('pro_monthly')).toBe(24900)
    expect(planAmountCents('pro_annual')).toBe(249000)
  })

  it('honours a catalogue override', () => {
    const override = {
      ...TIERS,
      vip: { monthly: 59, annual: 590 },
    }
    expect(planAmountCents('vip_monthly', override)).toBe(5900)
    expect(planAmountCents('vip_annual', override)).toBe(59000)
  })
})

describe('effectiveTier — dead statuses drop to community', () => {
  it('treats expired / canceled / unpaid as community', () => {
    expect(effectiveTier('vip', 'expired')).toBe('community')
    expect(effectiveTier('pro', 'canceled')).toBe('community')
    expect(effectiveTier('pro', 'cancelled')).toBe('community')
    expect(effectiveTier('vip', 'unpaid')).toBe('community')
  })

  it('fails open on past_due, active, and missing status', () => {
    expect(effectiveTier('vip', 'past_due')).toBe('vip')
    expect(effectiveTier('pro', 'active')).toBe('pro')
    expect(effectiveTier('vip', null)).toBe('vip')
    expect(effectiveTier('vip', '')).toBe('vip')
  })
})
