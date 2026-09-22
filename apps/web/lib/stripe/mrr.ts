/**
 * MRR from Stripe subscriptions (SPRINT K).
 *
 * WHY THIS IS NOT PRICED OFF users.tier: the roster and the money disagree.
 * Today /admin shows five Pro members and zero paying customers. Three hold a
 * comp code, two are unmarked manual grants, and none has ever been billed.
 * Pricing that roster off the list price would have reported $4,245/mo of
 * revenue that does not exist. A subscription in Stripe is the only artifact
 * that means someone was actually charged, so it is the only thing counted.
 *
 * The old source (TODO(VENDASTA-4) → billing_events) was never going to work
 * either: that table is an idempotency ledger of event ids, with no amounts.
 *
 * Pure and dependency-free so it can be unit-tested; the server module feeds it
 * Stripe's response. Amounts stay in CENTS throughout — a float dollar total is
 * how revenue numbers start disagreeing with Stripe by a cent.
 */

/** Subscription statuses that represent money actually flowing. */
export const MRR_STATUSES: ReadonlySet<string> = new Set(['active', 'trialing'])

export interface MrrPrice {
  unit_amount: number | null
  recurring: { interval: string; interval_count?: number | null } | null
}

export interface MrrSubscriptionItem {
  quantity?: number | null
  price: MrrPrice | null
}

export interface MrrSubscription {
  id: string
  status: string
  items?: { data?: MrrSubscriptionItem[] } | null
}

/** Months per billing interval. Anything else is not a recurring price. */
const MONTHS_PER_INTERVAL: Record<string, number> = {
  day: 1 / 30,
  week: 7 / 30,
  month: 1,
  year: 12,
}

/**
 * One subscription item's contribution, normalized to cents per month.
 *
 * A yearly $1,188 price is $99/month of MRR, not $1,188 — normalizing is the
 * whole point of the metric. Rounded per item so a total is always a whole
 * number of cents.
 */
export function itemMonthlyCents(item: MrrSubscriptionItem): number {
  const amount = item.price?.unit_amount
  const recurring = item.price?.recurring
  if (typeof amount !== 'number' || !recurring) return 0

  const months = MONTHS_PER_INTERVAL[recurring.interval]
  if (!months) return 0
  const count = recurring.interval_count && recurring.interval_count > 0 ? recurring.interval_count : 1

  const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1
  return Math.round((amount * quantity) / (months * count))
}

/** A whole subscription's monthly cents. Zero unless it is active or trialing. */
export function subscriptionMonthlyCents(sub: MrrSubscription): number {
  if (!MRR_STATUSES.has(sub.status)) return 0
  return (sub.items?.data ?? []).reduce((sum, item) => sum + itemMonthlyCents(item), 0)
}

export interface MrrSummary {
  /** Total monthly recurring revenue, in cents. */
  mrrCents: number
  /** Subscriptions actually being billed (active or trialing). */
  paidCount: number
  /** Subscriptions Stripe knows about that are NOT being billed today. */
  inactiveCount: number
}

export function summarizeMrr(subs: readonly MrrSubscription[]): MrrSummary {
  let mrrCents = 0
  let paidCount = 0
  let inactiveCount = 0
  for (const sub of subs) {
    if (MRR_STATUSES.has(sub.status)) {
      paidCount += 1
      mrrCents += subscriptionMonthlyCents(sub)
    } else {
      inactiveCount += 1
    }
  }
  return { mrrCents, paidCount, inactiveCount }
}

/**
 * Whole dollars for display. Cents are the stored unit; this is the last step
 * before a screen, never an intermediate.
 */
export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100
}

/** `$1,234` / `$1,234.50` — no cents when the amount is whole. */
export function formatMoneyCents(cents: number): string {
  const dollars = centsToDollars(cents)
  return `$${dollars.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}
