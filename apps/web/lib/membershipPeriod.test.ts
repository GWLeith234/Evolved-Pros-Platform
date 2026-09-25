import { describe, expect, it } from 'vitest'
import { entitlementsFor } from './entitlements'
import {
  applyMemberAccess,
  plannedDowngradeAudit,
  shouldDowngradeExpiredPaidMember,
  type MemberPeriodRow,
} from './membershipPeriod'
import { effectiveTier } from './tier'

const NOW = new Date('2026-09-25T12:00:00.000Z')
const PAST = '2026-08-29T00:00:00.000Z'
const JUNE = '2026-06-02T00:00:00.000Z'
const FUTURE = '2026-12-01T00:00:00.000Z'

function row(partial: MemberPeriodRow): MemberPeriodRow {
  return {
    tier: 'vip',
    tier_status: 'active',
    tier_expires_at: FUTURE,
    role: 'member',
    comp_promo_code_id: null,
    ...partial,
  }
}

describe('expired paid members downgrade to community', () => {
  it('downgrades an active member whose period has ended', () => {
    const before = row({ tier: 'vip', tier_status: 'active', tier_expires_at: PAST })
    expect(shouldDowngradeExpiredPaidMember(before, NOW)).toBe(true)
    const after = applyMemberAccess({ ...before }, NOW)
    expect(after.tier).toBe('community')
    expect(after.tier_status).toBe('expired')
    expect(entitlementsFor(after.tier, after.tier_status).academy).toBe('teaser')
    expect(effectiveTier(before.tier, before.tier_status, {
      tierExpiresAt: before.tier_expires_at,
      role: before.role,
      now: NOW,
    })).toBe('community')
  })

  it('downgrades a cancelled member after the paid period ends and keeps the cancellation', () => {
    const before = row({ tier: 'pro', tier_status: 'cancelled', tier_expires_at: PAST })
    expect(shouldDowngradeExpiredPaidMember(before, NOW)).toBe(true)
    const after = applyMemberAccess({ ...before }, NOW)
    expect(after.tier).toBe('community')
    expect(after.tier_status).toBe('cancelled')
    expect(entitlementsFor(after.tier, after.tier_status).network).toBe('teaser')
  })

  it('downgrades a trial and an already-expired paid tier', () => {
    expect(shouldDowngradeExpiredPaidMember(
      row({ tier: 'pro', tier_status: 'trial', tier_expires_at: PAST }),
      NOW,
    )).toBe(true)
    const expired = applyMemberAccess(
      row({ tier: 'Pro', tier_status: 'expired', tier_expires_at: PAST }),
      NOW,
    )
    expect(expired.tier).toBe('community')
    expect(expired.tier_status).toBe('expired')
  })
})

describe('comps, admins, and open periods stay', () => {
  it('does not downgrade a comp whose expiry is in the past', () => {
    const comp = row({
      tier: 'pro',
      tier_status: 'comp',
      tier_expires_at: JUNE,
      role: 'member',
    })
    expect(shouldDowngradeExpiredPaidMember(comp, NOW)).toBe(false)
    const after = applyMemberAccess({ ...comp }, NOW)
    expect(after).toEqual(comp)
    expect(effectiveTier(comp.tier, comp.tier_status, {
      tierExpiresAt: comp.tier_expires_at,
      role: comp.role,
      now: NOW,
    })).toBe('pro')
  })

  it('does not downgrade a comp flag when tier_status is still active', () => {
    const comp = row({
      tier: 'vip',
      tier_status: 'active',
      tier_expires_at: JUNE,
      comp_promo_code_id: '00000000-0000-0000-0000-000000000099',
    })
    expect(shouldDowngradeExpiredPaidMember(comp, NOW)).toBe(false)
    expect(applyMemberAccess({ ...comp }, NOW).tier).toBe('vip')
  })

  it('does not downgrade a member whose period end is still in the future', () => {
    const open = row({ tier: 'vip', tier_status: 'active', tier_expires_at: FUTURE })
    expect(shouldDowngradeExpiredPaidMember(open, NOW)).toBe(false)
    expect(applyMemberAccess({ ...open }, NOW)).toEqual(open)
  })

  it('keeps a cancellation paid until the period ends', () => {
    const open = row({ tier: 'pro', tier_status: 'cancelled', tier_expires_at: FUTURE })
    expect(shouldDowngradeExpiredPaidMember(open, NOW)).toBe(false)
    const after = applyMemberAccess({ ...open }, NOW)
    expect(after.tier).toBe('pro')
    expect(after.tier_status).toBe('active')
    expect(entitlementsFor(after.tier, after.tier_status).academy).toBe('full')
  })

  it('does not downgrade an admin', () => {
    const admin = row({
      tier: 'pro',
      tier_status: 'active',
      tier_expires_at: PAST,
      role: 'admin',
    })
    expect(shouldDowngradeExpiredPaidMember(admin, NOW)).toBe(false)
    expect(applyMemberAccess({ ...admin }, NOW)).toEqual(admin)
    expect(effectiveTier('pro', 'active', {
      tierExpiresAt: PAST,
      role: 'Admin',
      now: NOW,
    })).toBe('pro')
  })

  it('leaves past_due in the Stripe grace window', () => {
    const dunning = row({ tier: 'vip', tier_status: 'past_due', tier_expires_at: PAST })
    expect(shouldDowngradeExpiredPaidMember(dunning, NOW)).toBe(false)
    expect(applyMemberAccess({ ...dunning }, NOW).tier).toBe('vip')
  })
})

describe('downgrade writes one audit row', () => {
  it('plans one tier_change_log row for an expired active member and none for the others', () => {
    const active = row({ tier: 'vip', tier_status: 'active', tier_expires_at: PAST })
    const cancelled = row({ tier: 'pro', tier_status: 'cancelled', tier_expires_at: PAST })
    const comp = row({ tier: 'pro', tier_status: 'comp', tier_expires_at: JUNE })
    const future = row({ tier: 'vip', tier_status: 'active', tier_expires_at: FUTURE })
    const admin = row({ tier: 'pro', tier_status: 'active', tier_expires_at: PAST, role: 'admin' })

    const activeAudit = plannedDowngradeAudit(active, NOW)
    expect(activeAudit).toEqual({
      old_tier: 'vip',
      new_tier: 'community',
      old_tier_status: 'active',
      new_tier_status: 'expired',
      direction: 'tier,tier_status',
    })
    expect(plannedDowngradeAudit(cancelled, NOW)).toMatchObject({
      old_tier: 'pro',
      new_tier: 'community',
      new_tier_status: 'cancelled',
      direction: 'tier',
    })

    const planned = [active, cancelled, comp, future, admin]
      .map(member => plannedDowngradeAudit(member, NOW))
      .filter(Boolean)
    expect(planned).toHaveLength(2)

    const downgraded = applyMemberAccess({ ...active }, NOW)
    expect(plannedDowngradeAudit(downgraded, NOW)).toBeNull()
    expect(plannedDowngradeAudit(comp, NOW)).toBeNull()
    expect(plannedDowngradeAudit(future, NOW)).toBeNull()
    expect(plannedDowngradeAudit(admin, NOW)).toBeNull()
  })
})

describe('effectiveTier two-argument calls stay fail-open except dead statuses', () => {
  it('still collapses expired, canceled, and unpaid when no period end is passed', () => {
    expect(effectiveTier('vip', 'expired')).toBe('community')
    expect(effectiveTier('pro', 'canceled')).toBe('community')
    expect(effectiveTier('pro', 'cancelled')).toBe('community')
    expect(effectiveTier('vip', 'unpaid')).toBe('community')
    expect(effectiveTier('vip', 'past_due')).toBe('vip')
    expect(effectiveTier('pro', 'active')).toBe('pro')
    expect(effectiveTier('vip', null)).toBe('vip')
  })
})
