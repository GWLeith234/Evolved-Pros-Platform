import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const profile = vi.hoisted(() => ({
  current: {
    id: 'user-1',
    email: 'member@example.com',
    full_name: 'Member',
    tier: 'vip',
    tier_status: 'active',
    stripe_customer_id: 'cus_1',
    stripe_subscription_id: 'sub_vip',
  } as Record<string, string | null>,
}))

const seats = vi.hoisted(() => ({
  proSoldOut: false,
  calls: [] as string[],
}))

const stripe = vi.hoisted(() => ({
  subscriptions: {
    retrieve: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
  },
  checkout: { sessions: { create: vi.fn() } },
  customers: { create: vi.fn() },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({}),
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: () => ({
      update: () => ({
        eq: async () => ({ error: null }),
      }),
    }),
  },
}))

vi.mock('@/lib/auth/resolveCurrentUser', () => ({
  resolveCurrentUser: async () => profile.current,
}))

vi.mock('@/lib/stripe/config', async () => {
  const actual = await vi.importActual<typeof import('@/lib/stripe/config')>('@/lib/stripe/config')
  return {
    ...actual,
    getStripe: () => stripe,
    stripeConfigured: () => true,
  }
})

vi.mock('@/lib/commerce/catalogue', () => ({
  resolveStripePriceId: async () => null,
}))

vi.mock('@/lib/commerce/seats', () => ({
  seatStatusForTier: async (tier: string) => {
    seats.calls.push(tier)
    if (tier === 'pro' && seats.proSoldOut) {
      return { known: true, cap: 99, taken: 99, remaining: 0, soldOut: true }
    }
    if (tier === 'pro') {
      return { known: true, cap: 99, taken: 6, remaining: 93, soldOut: false }
    }
    return { known: true, cap: null, taken: 0, remaining: null, soldOut: false }
  },
  joinSeatWaitlist: async () => 'joined',
}))

import { POST } from '@/app/api/stripe/checkout/route'

function vipSub(priceId = 'price_vip_99') {
  return {
    id: 'sub_vip',
    status: 'active',
    items: { data: [{ id: 'si_vip', price: { id: priceId } }] },
  }
}

function proSub() {
  return {
    id: 'sub_pro',
    status: 'active',
    items: { data: [{ id: 'si_pro', price: { id: 'price_pro_849' } }] },
  }
}

async function post(plan: string) {
  return POST(new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ plan }),
  }))
}

describe('checkout plan changes', () => {
  beforeEach(() => {
    process.env.STRIPE_PRICE_VIP_MONTHLY_149 = 'price_vip_149'
    process.env.STRIPE_PRICE_PRO_MONTHLY_599 = 'price_pro_599'
    profile.current = {
      id: 'user-1',
      email: 'member@example.com',
      full_name: 'Member',
      tier: 'vip',
      tier_status: 'active',
      stripe_customer_id: 'cus_1',
      stripe_subscription_id: 'sub_vip',
    }
    seats.proSoldOut = false
    seats.calls = []
    stripe.subscriptions.retrieve.mockReset()
    stripe.subscriptions.update.mockReset()
    stripe.subscriptions.list.mockReset()
    stripe.checkout.sessions.create.mockReset()
    stripe.customers.create.mockReset()
    stripe.subscriptions.retrieve.mockResolvedValue(vipSub())
    stripe.subscriptions.list.mockResolvedValue({ data: [vipSub()], has_more: false })
    stripe.subscriptions.update.mockResolvedValue({ id: 'sub_vip' })
    stripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.test/session' })
    stripe.customers.create.mockResolvedValue({ id: 'cus_new' })
  })

  afterEach(() => {
    delete process.env.STRIPE_PRICE_VIP_MONTHLY_149
    delete process.env.STRIPE_PRICE_PRO_MONTHLY_599
  })

  it('upgrades VIP to The 99 by updating the item with proration and creates no second subscription', async () => {
    const res = await post('pro_monthly')
    expect(res.status).toBe(200)
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
    expect(stripe.subscriptions.update).toHaveBeenCalledTimes(1)
    expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_vip', {
      items: [{ id: 'si_vip', price: 'price_pro_599' }],
      proration_behavior: 'create_prorations',
      metadata: { user_id: 'user-1', tier: 'pro', plan: 'pro_monthly' },
    })
    expect(seats.calls).toContain('pro')
  })

  it('refuses the upgrade when the 99 paid seats are full', async () => {
    seats.proSoldOut = true
    const res = await post('pro_monthly')
    expect(res.status).toBe(409)
    const body = await res.json() as { soldOut?: boolean }
    expect(body.soldOut).toBe(true)
    expect(stripe.subscriptions.update).not.toHaveBeenCalled()
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
    // taken: 99 is the Stripe subscription count from seatStatusForTier.
    // Comps are not in that count (migration 094).
    expect(seats.calls).toEqual(['pro'])
  })

  it('downgrades The 99 to VIP on the same subscription', async () => {
    profile.current.tier = 'pro'
    profile.current.stripe_subscription_id = 'sub_pro'
    stripe.subscriptions.retrieve.mockResolvedValue(proSub())
    stripe.subscriptions.list.mockResolvedValue({ data: [proSub()], has_more: false })

    const res = await post('vip_monthly')
    expect(res.status).toBe(200)
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled()
    expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_pro', expect.objectContaining({
      items: [{ id: 'si_pro', price: 'price_vip_149' }],
      proration_behavior: 'create_prorations',
    }))
  })

  it('opens one Checkout Session for a free member with no subscription', async () => {
    profile.current.tier = 'community'
    profile.current.tier_status = 'active'
    profile.current.stripe_customer_id = null
    profile.current.stripe_subscription_id = null

    const res = await post('vip_monthly')
    expect(res.status).toBe(200)
    expect(stripe.subscriptions.update).not.toHaveBeenCalled()
    expect(stripe.checkout.sessions.create).toHaveBeenCalledTimes(1)
    const arg = stripe.checkout.sessions.create.mock.calls[0][0] as { mode: string; line_items: Array<{ price: string }> }
    expect(arg.mode).toBe('subscription')
    expect(arg.line_items).toEqual([{ price: 'price_vip_149', quantity: 1 }])
  })
})
