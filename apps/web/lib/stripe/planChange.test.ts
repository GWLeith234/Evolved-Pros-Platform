import { describe, expect, it } from 'vitest'
import { MRR_STATUSES } from './mrr'
import {
  planChangeAction,
  shouldGrantSubscriptionEvent,
  subscriptionPriceUpdateParams,
} from './planChange'

describe('planChangeAction', () => {
  it('updates a VIP subscription instead of opening a second checkout', () => {
    expect(planChangeAction({
      sameTier: false,
      entitledAtOrAbove: false,
      hasBillableSubscription: true,
      liveSubscriptionCount: 1,
    })).toBe('update')
  })

  it('downgrades on the same subscription', () => {
    expect(planChangeAction({
      sameTier: false,
      entitledAtOrAbove: true,
      hasBillableSubscription: true,
      liveSubscriptionCount: 1,
    })).toBe('update')
  })

  it('opens checkout only when nothing billable exists', () => {
    expect(planChangeAction({
      sameTier: false,
      entitledAtOrAbove: false,
      hasBillableSubscription: false,
      liveSubscriptionCount: 0,
    })).toBe('checkout')
  })

  it('refuses a third subscription when two are already live and none is stored', () => {
    expect(planChangeAction({
      sameTier: false,
      entitledAtOrAbove: false,
      hasBillableSubscription: false,
      liveSubscriptionCount: 2,
    })).toBe('refuse-duplicate')
  })

  it('treats the same tier as already owned', () => {
    expect(planChangeAction({
      sameTier: true,
      entitledAtOrAbove: true,
      hasBillableSubscription: true,
      liveSubscriptionCount: 1,
    })).toBe('already')
  })
})

describe('subscriptionPriceUpdateParams', () => {
  it('sets proration and does not describe a new subscription', () => {
    expect(subscriptionPriceUpdateParams({
      itemId: 'si_1',
      priceId: 'price_pro_599',
      metadata: { user_id: 'user-1', tier: 'pro', plan: 'pro_monthly' },
    })).toEqual({
      items: [{ id: 'si_1', price: 'price_pro_599' }],
      proration_behavior: 'create_prorations',
      metadata: { user_id: 'user-1', tier: 'pro', plan: 'pro_monthly' },
    })
  })
})

describe('shouldGrantSubscriptionEvent', () => {
  it('syncs a price change on the stored subscription even if a duplicate exists', () => {
    expect(shouldGrantSubscriptionEvent({ action: 'sync', liveBillableCount: 2 })).toEqual({
      grant: true,
      duplicate: true,
    })
  })

  it('does not adopt one of two live subscriptions', () => {
    expect(shouldGrantSubscriptionEvent({ action: 'adopt', liveBillableCount: 2 })).toEqual({
      grant: false,
      duplicate: true,
    })
  })

  it('ignores a second subscription', () => {
    expect(shouldGrantSubscriptionEvent({ action: 'ignore', liveBillableCount: 2 }).grant).toBe(false)
  })
})

describe('seat count', () => {
  it('counts active and trialing Stripe subscriptions, not comps', () => {
    // Migration 094. A comp has no Stripe subscription, so it does not
    // consume one of the 99. past_due is billable for plan changes but is
    // not MRR, matching the existing seat query.
    expect(MRR_STATUSES.has('active')).toBe(true)
    expect(MRR_STATUSES.has('trialing')).toBe(true)
    expect(MRR_STATUSES.has('comp')).toBe(false)
    expect(MRR_STATUSES.has('past_due')).toBe(false)
  })
})
