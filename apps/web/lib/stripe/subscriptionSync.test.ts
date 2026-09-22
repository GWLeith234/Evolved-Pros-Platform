import { describe, expect, it } from 'vitest'
import { shouldApplySubscriptionUpdate, shouldDowngradeOnDelete } from './subscriptionSync'

describe('subscription.updated must not replace a plan the member already has', () => {
  it('syncs the stored subscription', () => {
    expect(shouldApplySubscriptionUpdate({
      storedSubscriptionId: 'sub_vip',
      eventSubscriptionId: 'sub_vip',
      eventStatus: 'past_due',
      storedTier: 'vip',
    })).toBe('sync')
  })

  it('ignores a second subscription on a paying member', () => {
    expect(shouldApplySubscriptionUpdate({
      storedSubscriptionId: 'sub_vip',
      eventSubscriptionId: 'sub_pro_overflow',
      eventStatus: 'active',
      storedTier: 'vip',
    })).toBe('ignore')
    expect(shouldApplySubscriptionUpdate({
      storedSubscriptionId: 'sub_vip',
      eventSubscriptionId: 'sub_pro_overflow',
      eventStatus: 'canceled',
      storedTier: 'vip',
    })).toBe('ignore')
  })

  it('does not adopt a subscription onto a comp', () => {
    expect(shouldApplySubscriptionUpdate({
      storedSubscriptionId: null,
      eventSubscriptionId: 'sub_overflow',
      eventStatus: 'active',
      storedTier: 'pro',
    })).toBe('ignore')
  })

  it('adopts a live subscription onto a free member with none', () => {
    expect(shouldApplySubscriptionUpdate({
      storedSubscriptionId: null,
      eventSubscriptionId: 'sub_new',
      eventStatus: 'active',
      storedTier: 'community',
    })).toBe('adopt')
    expect(shouldApplySubscriptionUpdate({
      storedSubscriptionId: null,
      eventSubscriptionId: 'sub_dead',
      eventStatus: 'canceled',
      storedTier: 'community',
    })).toBe('ignore')
  })
})

describe('subscription.deleted downgrades only the granted subscription', () => {
  it('matches the stored id and nothing else', () => {
    expect(shouldDowngradeOnDelete({
      storedSubscriptionId: 'sub_vip',
      eventSubscriptionId: 'sub_vip',
    })).toBe(true)
    expect(shouldDowngradeOnDelete({
      storedSubscriptionId: 'sub_vip',
      eventSubscriptionId: 'sub_overflow',
    })).toBe(false)
    expect(shouldDowngradeOnDelete({
      storedSubscriptionId: null,
      eventSubscriptionId: 'sub_overflow',
    })).toBe(false)
  })
})
