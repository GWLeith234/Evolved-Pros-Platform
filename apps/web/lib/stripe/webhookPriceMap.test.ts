import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const db = vi.hoisted(() => ({
  user: {
    id: 'user-1',
    tier: 'vip',
    email: 'member@example.com',
    full_name: 'Member',
    stripe_subscription_id: 'sub_1',
    stripe_customer_id: 'cus_1',
    comp_promo_code_id: null as string | null,
  },
  updates: [] as Array<Record<string, unknown>>,
  inserts: [] as string[],
}))

const stripe = vi.hoisted(() => ({
  webhooks: { constructEvent: vi.fn() },
  subscriptions: {
    retrieve: vi.fn(),
    list: vi.fn(),
    cancel: vi.fn(),
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => {
      const filters: Record<string, unknown> = {}
      const api = {
        select() { return api },
        eq(column: string, value: unknown) {
          filters[column] = value
          return api
        },
        maybeSingle: async () => {
          if (table === 'billing_events') return { data: null }
          if (table !== 'users') return { data: null }
          const user = db.user
          if (filters.stripe_subscription_id && user.stripe_subscription_id !== filters.stripe_subscription_id) {
            return { data: null }
          }
          if (filters.id && user.id !== filters.id) return { data: null }
          if (filters.stripe_customer_id && user.stripe_customer_id !== filters.stripe_customer_id) {
            return { data: null }
          }
          return { data: user }
        },
        update(values: Record<string, unknown>) {
          return {
            eq: async () => {
              db.updates.push({ table, ...values })
              if (table === 'users' && typeof values.tier === 'string') db.user.tier = values.tier
              return { error: null }
            },
          }
        },
        insert: async () => {
          db.inserts.push(table)
          return { error: null }
        },
        upsert: async () => ({ error: null }),
      }
      return api
    },
  },
}))

vi.mock('@/lib/stripe/config', async () => {
  const actual = await vi.importActual<typeof import('@/lib/stripe/config')>('@/lib/stripe/config')
  return {
    ...actual,
    getStripe: () => stripe,
  }
})

vi.mock('@/lib/commerce/seats', () => ({
  seatStatusForTier: async () => ({ known: true, cap: 99, taken: 1, remaining: 98, soldOut: false }),
  joinSeatWaitlist: async () => 'joined',
}))

vi.mock('@/lib/crm/conversion', () => ({
  bestEffortConversion: async () => {},
  notifyPaidAdmins: async () => {},
  upsertPaidProspect: async () => {},
}))

vi.mock('@/lib/crm/intakeDb', () => ({
  supabaseIntakeDb: {},
}))

import { POST } from '@/app/api/stripe/webhook/route'

const PRICE_ENV = {
  STRIPE_PRICE_VIP_MONTHLY_149: 'price_vip_149',
  STRIPE_PRICE_PRO_MONTHLY_599: 'price_pro_599',
  STRIPE_PRICE_VIP_MONTHLY: 'price_vip_99',
  STRIPE_PRICE_VIP_MONTHLY_49: 'price_vip_49',
  STRIPE_PRICE_VIP_ANNUAL: 'price_vip_490',
  STRIPE_PRICE_PRO_MONTHLY: 'price_pro_849',
  STRIPE_PRICE_PRO_MONTHLY_249: 'price_pro_249',
  STRIPE_PRICE_PRO_ANNUAL: 'price_pro_2490',
} as const

function subscriptionEvent(priceId: string, subId = 'sub_1') {
  return {
    id: `evt_${priceId}_${subId}`,
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: subId,
        customer: 'cus_1',
        status: 'active',
        cancel_at_period_end: false,
        items: { data: [{ price: { id: priceId } }] },
        current_period_end: 1_800_000_000,
      },
    },
  }
}

async function post(event: ReturnType<typeof subscriptionEvent>) {
  stripe.webhooks.constructEvent.mockReturnValue(event)
  stripe.subscriptions.list.mockResolvedValue({
    data: [{ id: event.data.object.id, status: 'active' }],
    has_more: false,
  })
  return POST(new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig_test' },
    body: '{}',
  }))
}

describe('webhook subscription.updated price mapping', () => {
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    for (const [name, id] of Object.entries(PRICE_ENV)) process.env[name] = id
    db.user = {
      id: 'user-1',
      tier: 'vip',
      email: 'member@example.com',
      full_name: 'Member',
      stripe_subscription_id: 'sub_1',
      stripe_customer_id: 'cus_1',
      comp_promo_code_id: null,
    }
    db.updates = []
    db.inserts = []
    stripe.webhooks.constructEvent.mockReset()
    stripe.subscriptions.list.mockReset()
    stripe.subscriptions.retrieve.mockReset()
  })

  afterEach(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    for (const name of Object.keys(PRICE_ENV)) delete process.env[name]
  })

  it.each([
    ['price_vip_149', 'vip'],
    ['price_pro_599', 'pro'],
    ['price_vip_99', 'vip'],
    ['price_vip_49', 'vip'],
    ['price_vip_490', 'vip'],
    ['price_pro_849', 'pro'],
    ['price_pro_249', 'pro'],
    ['price_pro_2490', 'pro'],
  ] as const)('maps %s to %s and does not insert a second user row', async (priceId, tier) => {
    db.updates = []
    db.inserts = []
    db.user.tier = tier === 'vip' ? 'pro' : 'vip'
    const res = await post(subscriptionEvent(priceId))
    expect(res.status).toBe(200)
    const userUpdates = db.updates.filter(row => row.table === 'users')
    expect(userUpdates).toHaveLength(1)
    expect(userUpdates[0]?.tier).toBe(tier)
    expect(db.inserts).not.toContain('users')
  })

  it('downgrades a stored subscription when the price changes to VIP', async () => {
    db.user.tier = 'pro'
    const res = await post(subscriptionEvent('price_vip_149'))
    expect(res.status).toBe(200)
    const userUpdates = db.updates.filter(row => row.table === 'users')
    expect(userUpdates.at(-1)?.tier).toBe('vip')
    expect(userUpdates.at(-1)?.stripe_subscription_id).toBe('sub_1')
  })

  it('does not grant a second live subscription', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    stripe.webhooks.constructEvent.mockReturnValue(subscriptionEvent('price_pro_599', 'sub_extra'))
    stripe.subscriptions.list.mockResolvedValue({
      data: [
        { id: 'sub_1', status: 'active' },
        { id: 'sub_extra', status: 'active' },
      ],
      has_more: false,
    })
    const res = await POST(new Request('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'sig_test' },
      body: '{}',
    }))
    expect(res.status).toBe(200)
    expect(db.updates.filter(row => row.table === 'users')).toHaveLength(0)
    expect(warn.mock.calls.some(call => String(call[0]).includes('duplicate_active_subscriptions'))).toBe(true)
    warn.mockRestore()
  })
})
