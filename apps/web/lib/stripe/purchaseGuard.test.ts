import { describe, expect, it } from 'vitest'
import { alreadyEntitledTo, planTier } from './purchaseGuard'

// The five cases the sprint names, plus the edges around them. Each asserts on
// the DOUBLE-BILLING outcome, not on an intermediate value: `true` means the
// route returns 409 and no second Stripe subscription is created.

describe('alreadyEntitledTo — the five required cases', () => {
  it('free → VIP is allowed', () => {
    expect(alreadyEntitledTo('community', 'active', 'vip_monthly')).toBe(false)
  })

  it('VIP → Pro is allowed (upgrades must keep working)', () => {
    expect(alreadyEntitledTo('vip', 'active', 'pro_monthly')).toBe(false)
  })

  it('VIP → VIP is blocked', () => {
    expect(alreadyEntitledTo('vip', 'active', 'vip_monthly')).toBe(true)
  })

  it('Pro → VIP is blocked (a higher tier blocks a lower one)', () => {
    expect(alreadyEntitledTo('pro', 'active', 'vip_monthly')).toBe(true)
  })

  it('canceled VIP → VIP is allowed (re-purchase after churn)', () => {
    expect(alreadyEntitledTo('vip', 'canceled', 'vip_monthly')).toBe(false)
  })
})

describe('alreadyEntitledTo — dead subscription statuses', () => {
  it.each(['canceled', 'cancelled', 'unpaid', 'CANCELED', 'Unpaid'])(
    'status %s drops entitlement so the tier can be re-bought',
    status => {
      expect(alreadyEntitledTo('vip', status, 'vip_monthly')).toBe(false)
      expect(alreadyEntitledTo('pro', status, 'pro_monthly')).toBe(false)
    },
  )

  it('past_due still blocks — a grace window is not a churn', () => {
    // effectiveTier deliberately fails open on past_due, so the member keeps
    // access; letting them buy a second subscription would double-bill them.
    expect(alreadyEntitledTo('vip', 'past_due', 'vip_monthly')).toBe(true)
  })

  it('legacy "expired" is dead — repurchase is allowed', () => {
    expect(alreadyEntitledTo('vip', 'expired', 'vip_monthly')).toBe(false)
    expect(alreadyEntitledTo('pro', 'expired', 'pro_monthly')).toBe(false)
  })

  it.each([null, undefined, ''])('missing status (%s) still blocks a same-tier repurchase', status => {
    expect(alreadyEntitledTo('vip', status, 'vip_monthly')).toBe(true)
  })
})

describe('alreadyEntitledTo — annual/monthly interval', () => {
  it('blocks a same-tier purchase regardless of interval', () => {
    // Switching VIP monthly → VIP annual is a plan CHANGE, which belongs in the
    // billing portal. Running it through checkout opens a second subscription.
    expect(alreadyEntitledTo('vip', 'active', 'vip_annual')).toBe(true)
    expect(alreadyEntitledTo('vip', 'active', 'vip_monthly')).toBe(true)
  })

  it('allows the upgrade on either interval', () => {
    expect(alreadyEntitledTo('vip', 'active', 'pro_annual')).toBe(false)
    expect(alreadyEntitledTo('community', 'active', 'vip_annual')).toBe(false)
  })
})

describe('alreadyEntitledTo — no tier at all', () => {
  it.each([null, undefined, ''])('a member with tier %s can buy anything', tier => {
    expect(alreadyEntitledTo(tier, 'active', 'vip_monthly')).toBe(false)
    expect(alreadyEntitledTo(tier, 'active', 'pro_annual')).toBe(false)
  })

  it('an unrecognised tier string does not block (rank 0)', () => {
    expect(alreadyEntitledTo('legacy-gold', 'active', 'vip_monthly')).toBe(false)
  })

  it('is case-insensitive on the tier value', () => {
    expect(alreadyEntitledTo('VIP', 'active', 'vip_monthly')).toBe(true)
    expect(alreadyEntitledTo('Pro', 'active', 'vip_monthly')).toBe(true)
  })
})

describe('planTier', () => {
  it('maps plan keys to the tier they grant', () => {
    expect(planTier('vip_monthly')).toBe('vip')
    expect(planTier('vip_annual')).toBe('vip')
    expect(planTier('pro_monthly')).toBe('pro')
    expect(planTier('pro_annual')).toBe('pro')
  })
})
