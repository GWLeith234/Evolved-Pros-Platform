import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  MRR_STATUSES,
  centsToDollars,
  formatMoneyCents,
  itemMonthlyCents,
  subscriptionMonthlyCents,
  summarizeMrr,
  type MrrSubscription,
} from './mrr'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel: string) => readFileSync(resolve(here, rel), 'utf8')

function sub(
  status: string,
  items: Array<{ amount: number | null; interval?: string; count?: number; qty?: number }>,
): MrrSubscription {
  return {
    id: `sub_${status}_${items.length}`,
    status,
    items: {
      data: items.map(i => ({
        quantity: i.qty ?? 1,
        price:
          i.amount === null
            ? null
            : {
                unit_amount: i.amount,
                recurring: { interval: i.interval ?? 'month', interval_count: i.count ?? 1 },
              },
      })),
    },
  }
}

describe('itemMonthlyCents — normalizes every interval to one month', () => {
  it('passes a monthly price through', () => {
    expect(itemMonthlyCents({ price: { unit_amount: 9900, recurring: { interval: 'month' } } })).toBe(9900)
  })

  it('divides a yearly price by twelve', () => {
    // $1,188/yr is $99/mo of MRR, not $1,188. This is the whole metric.
    expect(itemMonthlyCents({ price: { unit_amount: 118800, recurring: { interval: 'year' } } })).toBe(9900)
  })

  it('honours interval_count', () => {
    // Billed $198 every 2 months = $99/mo.
    expect(
      itemMonthlyCents({
        price: { unit_amount: 19800, recurring: { interval: 'month', interval_count: 2 } },
      }),
    ).toBe(9900)
  })

  it('multiplies by quantity', () => {
    expect(
      itemMonthlyCents({ quantity: 3, price: { unit_amount: 9900, recurring: { interval: 'month' } } }),
    ).toBe(29700)
  })

  it('treats a missing amount, missing price or one-time price as zero', () => {
    expect(itemMonthlyCents({ price: null })).toBe(0)
    expect(itemMonthlyCents({ price: { unit_amount: null, recurring: { interval: 'month' } } })).toBe(0)
    expect(itemMonthlyCents({ price: { unit_amount: 9900, recurring: null } })).toBe(0)
    expect(itemMonthlyCents({ price: { unit_amount: 9900, recurring: { interval: 'decade' } } })).toBe(0)
  })

  it('never returns a fractional cent', () => {
    // $100/yr does not divide evenly by 12.
    const cents = itemMonthlyCents({ price: { unit_amount: 10000, recurring: { interval: 'year' } } })
    expect(Number.isInteger(cents)).toBe(true)
    expect(cents).toBe(833)
  })
})

describe('subscriptionMonthlyCents — only money that is actually flowing', () => {
  it('counts active and trialing', () => {
    expect(subscriptionMonthlyCents(sub('active', [{ amount: 9900 }]))).toBe(9900)
    expect(subscriptionMonthlyCents(sub('trialing', [{ amount: 84900 }]))).toBe(84900)
    expect([...MRR_STATUSES].sort()).toEqual(['active', 'trialing'])
  })

  it('counts nothing for a dead or unpaid subscription', () => {
    for (const status of ['canceled', 'unpaid', 'past_due', 'incomplete', 'incomplete_expired', 'paused']) {
      expect(subscriptionMonthlyCents(sub(status, [{ amount: 9900 }])), status).toBe(0)
    }
  })

  it('sums multiple line items', () => {
    expect(subscriptionMonthlyCents(sub('active', [{ amount: 9900 }, { amount: 84900 }]))).toBe(94800)
  })
})

describe('summarizeMrr', () => {
  it('separates billed from not-billed and totals only the billed', () => {
    const summary = summarizeMrr([
      sub('active', [{ amount: 9900 }]),
      sub('active', [{ amount: 84900 }]),
      sub('trialing', [{ amount: 9900 }]),
      sub('canceled', [{ amount: 84900 }]),
      sub('past_due', [{ amount: 9900 }]),
    ])
    expect(summary.paidCount).toBe(3)
    expect(summary.inactiveCount).toBe(2)
    expect(summary.mrrCents).toBe(9900 + 84900 + 9900)
  })

  it('reads zero on an empty account, which is the state before launch', () => {
    expect(summarizeMrr([])).toEqual({ mrrCents: 0, paidCount: 0, inactiveCount: 0 })
  })

  // The VERIFY case for this sprint: one real VIP purchase at $99.
  it('reports exactly $99 MRR and 1 paid member after a single VIP purchase', () => {
    const summary = summarizeMrr([sub('active', [{ amount: 9900 }])])
    expect(summary.mrrCents).toBe(9900)
    expect(summary.paidCount).toBe(1)
    expect(formatMoneyCents(summary.mrrCents)).toBe('$99')
  })
})

describe('money formatting', () => {
  it('drops cents on whole amounts and keeps them otherwise', () => {
    expect(formatMoneyCents(9900)).toBe('$99')
    expect(formatMoneyCents(84900)).toBe('$849')
    expect(formatMoneyCents(8405100)).toBe('$84,051') // 99 seats at $849
    expect(formatMoneyCents(833)).toBe('$8.33')
    expect(formatMoneyCents(0)).toBe('$0')
  })

  it('converts cents to dollars without float drift', () => {
    expect(centsToDollars(9900)).toBe(99)
    expect(centsToDollars(833)).toBe(8.33)
  })
})

describe('revenue reads from Stripe, never from the roster', () => {
  const revenue = read('./revenue.ts')
  const route = read('../../app/api/admin/revenue/route.ts')
  const dashboard = read('../../app/(admin)/admin/page.tsx')

  it('no longer returns hardcoded zeros behind a TODO', () => {
    // Comments stripped: the route explains the TODO it replaced.
    const code = route.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(code).not.toContain('TODO(VENDASTA-4)')
    expect(code).not.toContain('currentMrr: 0')
    expect(code).toContain('getRevenueSnapshot')
  })

  it('sources MRR from Stripe subscriptions, not tier counts times list price', () => {
    expect(revenue).toContain('subscriptions.list')
    expect(revenue).toContain('subscriptionMonthlyCents')
    // The roster helpers price off tier; using them here is the bug this
    // replaced. Counting comps and grants would have invented revenue.
    expect(revenue).not.toContain('computeMrr')
    expect(revenue).not.toContain('tierMonthlyPrice')
  })

  it('distinguishes "Stripe unreachable" from "nobody is paying"', () => {
    expect(revenue).toContain('available')
    expect(revenue).toContain('emptyRevenueSnapshot(false)')
    expect(dashboard).toContain('Could not reach Stripe')
    expect(dashboard).not.toContain('Billing not connected')
  })

  it('splits paid members from comped and granted access', () => {
    expect(dashboard).toContain("label: 'Paid members'")
    expect(dashboard).toContain("label: 'Comped & granted'")
    expect(dashboard).not.toContain("label: 'Pro members'")
    // A paid tier with no Stripe subscription is access that was given.
    expect(revenue).toContain('!row.stripe_subscription_id')
  })

  it('never logs a Stripe error message, only a code', () => {
    expect(revenue).toContain('code ?? ')
    expect(revenue).not.toMatch(/console\.\w+\([^)]*err\.message/)
  })

  it('bounds its pagination so the dashboard cannot hang', () => {
    expect(revenue).toMatch(/page < \d+/)
  })
})
