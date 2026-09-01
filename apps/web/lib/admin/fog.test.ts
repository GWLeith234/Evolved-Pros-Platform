import { describe, it, expect } from 'vitest'
import {
  FOG_BADGE,
  FOG_LABEL,
  FOG_PROMO_CODE,
  MEMBER_FILTERS,
  friendsOfGeorgeToCompPromoCodeId,
  isFogMember,
  matchesMemberFilter,
  memberPlanBadges,
  shouldApplyFriendsOfGeorge,
} from './fog'

const FOG_PROMO_ID = 'promo-friends-of-george'

function member(overrides: {
  tier?: string | null
  role?: string | null
  tierStatus?: string | null
  isComped?: boolean
  mrr?: number
}) {
  return {
    tier: overrides.tier ?? 'pro',
    role: overrides.role ?? 'member',
    tierStatus: overrides.tierStatus ?? 'active',
    isComped: overrides.isComped ?? false,
    mrr: overrides.mrr ?? 0,
  }
}

describe('isFogMember — stored flag only, never inferred from MRR', () => {
  it('is true when isComped is set', () => {
    expect(isFogMember({ isComped: true })).toBe(true)
  })

  it('is true when comp_promo_code_id is set (existing complimentary column)', () => {
    expect(isFogMember({ comp_promo_code_id: FOG_PROMO_ID })).toBe(true)
    expect(isFogMember({ compPromoCodeId: FOG_PROMO_ID })).toBe(true)
  })

  it('is false for a paid VIP', () => {
    expect(isFogMember({ isComped: false })).toBe(false)
    expect(isFogMember({ comp_promo_code_id: null })).toBe(false)
  })

  it('does not auto-flag No MRR / unpaid PRO / owner-style $0 rows', () => {
    // Mitchell / geoleith-style unpaid PRO and owner accounts show "No MRR"
    // but are not Friends of George unless the stored flag is set.
    expect(isFogMember({ isComped: false })).toBe(false)
    expect(isFogMember({ isComped: false, comp_promo_code_id: null })).toBe(false)
    expect(isFogMember({})).toBe(false)
    expect(isFogMember(null)).toBe(false)
  })
})

describe('memberPlanBadges — FOG gold flag vs paid VIP', () => {
  it('shows a FOG pill plus the current tier, not VIP, for a FOG + ACTIVE Pro', () => {
    const badges = memberPlanBadges({ role: 'member', tier: 'pro', isComped: true })
    expect(badges).toEqual([
      { kind: 'fog', label: 'FOG' },
      { kind: 'tier', label: 'PRO' },
    ])
    expect(badges.some(b => b.label === 'VIP')).toBe(false)
  })

  it('keeps paid VIP labeled VIP and does not add FOG', () => {
    const badges = memberPlanBadges({ role: 'member', tier: 'vip', isComped: false })
    expect(badges).toEqual([{ kind: 'tier', label: 'VIP' }])
  })

  it('can show FOG and VIP as distinct pills when both are set', () => {
    const badges = memberPlanBadges({ role: 'member', tier: 'vip', isComped: true })
    expect(badges).toEqual([
      { kind: 'fog', label: 'FOG' },
      { kind: 'tier', label: 'VIP' },
    ])
  })

  it('does not invent a FOG pill for unpaid PRO (No MRR, not comped)', () => {
    const badges = memberPlanBadges({ role: 'member', tier: 'pro', isComped: false })
    expect(badges).toEqual([{ kind: 'tier', label: 'PRO' }])
  })

  it('does not treat guest persona as FOG', () => {
    const badges = memberPlanBadges({ role: 'guest', tier: 'pro', isComped: false })
    expect(badges.map(b => b.kind)).toEqual(['guest', 'tier'])
    expect(badges.some(b => b.kind === 'fog')).toBe(false)
  })
})

describe('FOG badge styling', () => {
  it('is labeled FOG and uses the VIP gold family (not the PRO red)', () => {
    expect(FOG_BADGE.label).toBe('FOG')
    expect(FOG_LABEL).toBe('FOG')
    expect(FOG_BADGE.color).toBe('#a07c1e')
    expect(FOG_BADGE.bg).toContain('201,168,76')
    expect(FOG_BADGE.color).not.toBe('#C9302A')
  })
})

describe('matchesMemberFilter — FOG chip next to existing filters', () => {
  it('includes FOG in the filter row after VIP', () => {
    expect(MEMBER_FILTERS).toEqual(['All', 'Pro', 'VIP', 'FOG', 'Guest', 'Trial', 'Cancelled'])
  })

  it('FOG filter returns only flagged members', () => {
    const roster = [
      member({ tier: 'pro', isComped: true, mrr: 0 }),
      member({ tier: 'vip', isComped: false, mrr: 49 }),
      member({ tier: 'pro', isComped: false, mrr: 0 }),
    ]
    expect(roster.filter(m => matchesMemberFilter(m, 'FOG'))).toEqual([roster[0]])
  })

  it('VIP filter still returns paid VIP, not FOG-only Pro', () => {
    const paidVip = member({ tier: 'vip', isComped: false, mrr: 49 })
    const fogPro = member({ tier: 'pro', isComped: true, mrr: 0 })
    expect(matchesMemberFilter(paidVip, 'VIP')).toBe(true)
    expect(matchesMemberFilter(fogPro, 'VIP')).toBe(false)
    expect(matchesMemberFilter(fogPro, 'FOG')).toBe(true)
    expect(matchesMemberFilter(fogPro, 'Pro')).toBe(true)
  })

  it('empty FOG set stays empty — no invented names', () => {
    const roster = [
      member({ tier: 'vip', isComped: false, mrr: 49 }),
      member({ tier: 'pro', isComped: false, mrr: 0 }),
    ]
    expect(roster.filter(m => matchesMemberFilter(m, 'FOG'))).toEqual([])
  })
})

describe('friends_of_george field — maps onto users.comp_promo_code_id', () => {
  it('uses the seeded Friends of George promo code name', () => {
    expect(FOG_PROMO_CODE).toBe('FRIENDSOFGEORGE')
  })

  it('true writes the FOG promo id; false clears the column', () => {
    expect(friendsOfGeorgeToCompPromoCodeId(true, FOG_PROMO_ID)).toEqual({ value: FOG_PROMO_ID })
    expect(friendsOfGeorgeToCompPromoCodeId(false, FOG_PROMO_ID)).toEqual({ value: null })
    expect(friendsOfGeorgeToCompPromoCodeId(false, null)).toEqual({ value: null })
  })

  it('refuses to invent a FOG grant when the promo code is missing', () => {
    expect(friendsOfGeorgeToCompPromoCodeId(true, null)).toEqual({
      error: 'Friends of George promo code is not configured.',
    })
    expect(friendsOfGeorgeToCompPromoCodeId(true, undefined)).toEqual({
      error: 'Friends of George promo code is not configured.',
    })
  })

  it('only applies when the admin edit body sends a real boolean', () => {
    expect(shouldApplyFriendsOfGeorge({ friends_of_george: true })).toBe(true)
    expect(shouldApplyFriendsOfGeorge({ friends_of_george: false })).toBe(true)
    expect(shouldApplyFriendsOfGeorge({})).toBe(false)
    expect(shouldApplyFriendsOfGeorge({ friends_of_george: 'yes' })).toBe(false)
  })
})
