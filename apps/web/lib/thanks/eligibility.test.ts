import { describe, expect, it } from 'vitest'
import {
  classifyRecipient,
  decideThanksGrant,
  fogOverrideAllowed,
  isAlreadyMember,
  isAlreadyPaid,
  isFogBlocked,
} from './eligibility'

const paid = {
  email: 'paid@example.com',
  tier: 'pro',
  tier_status: 'active',
  stripe_subscription_id: 'sub_live',
}

const vipStripe = {
  email: 'vip@example.com',
  tier: 'vip',
  tier_status: 'active',
  stripe_customer_id: 'cus_live',
}

const fogPro = {
  email: 'fog@example.com',
  tier: 'pro',
  tier_status: 'active',
  stripe_subscription_id: null,
  stripe_customer_id: null,
}

const community = {
  email: 'member@example.com',
  tier: 'community',
  tier_status: 'active',
}

describe('already_paid / already_member', () => {
  it('treats Stripe-backed VIP/Pro as already paid', () => {
    expect(isAlreadyPaid(paid)).toBe(true)
    expect(isAlreadyPaid(vipStripe)).toBe(true)
    expect(decideThanksGrant(paid)).toEqual({ action: 'leave_alone', reason: 'already_paid' })
  })

  it('does not treat FOG / comp Pro without Stripe as paid', () => {
    expect(isAlreadyPaid(fogPro)).toBe(false)
    expect(isAlreadyMember(fogPro)).toBe(true)
    expect(decideThanksGrant(fogPro)).toEqual({ action: 'leave_alone', reason: 'already_member' })
  })

  it('leaves an existing community member alone', () => {
    expect(isAlreadyMember(community)).toBe(true)
    expect(decideThanksGrant(community)).toEqual({ action: 'leave_alone', reason: 'already_member' })
  })

  it('grants community only when there is no users row', () => {
    expect(decideThanksGrant(null)).toEqual({ action: 'grant_community' })
  })
})

describe('FOG exclusion', () => {
  it('blocks pending and redeemed FOG emails without override+reason', () => {
    expect(isFogBlocked({ email: 'a@example.com', status: 'invited' }, { override: false, reason: '' })).toBe(true)
    expect(isFogBlocked({ email: 'a@example.com', status: 'redeemed' }, { override: false, reason: '' })).toBe(true)
    expect(isFogBlocked({ email: 'a@example.com', status: 'revoked' }, { override: false, reason: '' })).toBe(false)
  })

  it('allows override only with a written reason', () => {
    expect(fogOverrideAllowed(true, '')).toEqual({ ok: false, override: true, reason: '' })
    expect(fogOverrideAllowed(true, 'George asked for this one')).toEqual({
      ok: true,
      override: true,
      reason: 'George asked for this one',
    })
    expect(
      isFogBlocked({ email: 'a@example.com', status: 'invited' }, { override: true, reason: 'George asked' }),
    ).toBe(false)
  })
})

describe('classifyRecipient', () => {
  it('skips paid, members, FOG, and invalids', () => {
    expect(classifyRecipient({ email: 'not-an-email' })).toBe('invalid')
    expect(classifyRecipient({ email: 'paid@example.com', member: paid })).toBe('already_paid')
    expect(classifyRecipient({ email: 'member@example.com', member: community })).toBe('already_member')
    expect(
      classifyRecipient({
        email: 'fog@example.com',
        fog: { email: 'fog@example.com', status: 'redeemed' },
      }),
    ).toBe('fog_excluded')
    expect(classifyRecipient({ email: 'new@example.com' })).toBe('invite')
  })
})
