import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const profile = vi.hoisted(() => ({
  current: null as null | {
    id: string
    email: string
    tier: string
    tier_status: string
    stripe_customer_id: string | null
  },
}))

const eventRow = vi.hoisted(() => ({
  current: {
    id: 'evt_1',
    title: 'LIVE workshop',
    price_cents: 50000,
    is_published: true,
  },
}))

const stripe = vi.hoisted(() => ({
  checkout: { sessions: { create: vi.fn() } },
  coupons: { create: vi.fn() },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({}),
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => {
      if (table !== 'events') throw new Error(`unexpected table ${table}`)
      return {
        select: () => ({
          eq: (_col: string, id: string) => ({
            maybeSingle: async () => ({
              data: id === eventRow.current.id ? eventRow.current : null,
              error: null,
            }),
          }),
        }),
      }
    },
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

import { POST } from '@/app/api/events/[eventId]/ticket/route'

function post(body: Record<string, unknown>) {
  return POST(
    new Request('http://localhost/api/events/evt_1/ticket', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: { eventId: 'evt_1' } },
  )
}

function unitAmount(): number {
  const arg = stripe.checkout.sessions.create.mock.calls.at(-1)?.[0] as {
    mode: string
    discounts?: unknown
    line_items: Array<{ price_data: { unit_amount: number } }>
  }
  expect(arg.mode).toBe('payment')
  expect(arg.discounts).toBeUndefined()
  expect(JSON.stringify(arg)).not.toContain('coupon')
  return arg.line_items[0].price_data.unit_amount
}

describe('LIVE ticket checkout discount', () => {
  beforeEach(() => {
    delete process.env.LIVE_DISCOUNT_PCT_COMMUNITY
    delete process.env.LIVE_DISCOUNT_PCT_VIP
    delete process.env.LIVE_DISCOUNT_PCT_PRO
    profile.current = {
      id: 'user-1',
      email: 'member@example.com',
      tier: 'vip',
      tier_status: 'active',
      stripe_customer_id: 'cus_1',
    }
    eventRow.current = {
      id: 'evt_1',
      title: 'LIVE workshop',
      price_cents: 50000,
      is_published: true,
    }
    stripe.checkout.sessions.create.mockReset()
    stripe.coupons.create.mockReset()
    stripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.test/ticket' })
  })

  afterEach(() => {
    delete process.env.LIVE_DISCOUNT_PCT_COMMUNITY
    delete process.env.LIVE_DISCOUNT_PCT_VIP
    delete process.env.LIVE_DISCOUNT_PCT_PRO
  })

  it('charges VIP 10 percent off the database price', async () => {
    const res = await post({})
    expect(res.status).toBe(200)
    expect(unitAmount()).toBe(45000)
    expect(stripe.coupons.create).not.toHaveBeenCalled()
    expect(stripe.checkout.sessions.create).toHaveBeenCalledTimes(1)
  })

  it('charges The 99 20 percent off the database price', async () => {
    profile.current!.tier = 'pro'
    const res = await post({})
    expect(res.status).toBe(200)
    expect(unitAmount()).toBe(40000)
  })

  it('charges Community the full list price', async () => {
    profile.current!.tier = 'community'
    const res = await post({})
    expect(res.status).toBe(200)
    expect(unitAmount()).toBe(50000)
  })

  it('charges a logged-out buyer the full list price', async () => {
    profile.current = null
    const res = await post({})
    expect(res.status).toBe(200)
    expect(unitAmount()).toBe(50000)
    const arg = stripe.checkout.sessions.create.mock.calls[0][0] as { customer?: string; customer_email?: string }
    expect(arg.customer).toBeUndefined()
    expect(arg.customer_email).toBeUndefined()
  })

  it('ignores a client-sent tier, percent, and unit amount', async () => {
    profile.current!.tier = 'community'
    const res = await post({
      tier: 'pro',
      percent: 20,
      unit_amount: 100,
      price_cents: 100,
      eventId: 'evt_other',
    })
    expect(res.status).toBe(200)
    expect(unitAmount()).toBe(50000)
    expect(stripe.checkout.sessions.create).toHaveBeenCalledTimes(1)
  })
})
