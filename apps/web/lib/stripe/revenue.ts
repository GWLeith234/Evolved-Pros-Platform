import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { getStripe, stripeConfigured } from '@/lib/stripe/config'
import { normalizeTierKey, type TierKey } from '@/lib/pricing'
import {
  MRR_STATUSES,
  subscriptionMonthlyCents,
  type MrrSubscription,
} from '@/lib/stripe/mrr'

/**
 * Real revenue, read from Stripe (SPRINT K).
 *
 * Replaces the hardcoded zeros behind TODO(VENDASTA-4) in /api/admin/revenue
 * and the "Billing not connected" hint on /admin. Both now answer from the
 * payment processor, so the number on the dashboard is the number Stripe would
 * pay out. See lib/stripe/mrr.ts for why the roster is not the source.
 *
 * NEVER THROWS. An admin dashboard that 500s because Stripe is slow is worse
 * than one that says it could not reach Stripe, so every failure degrades to
 * `available: false` and the caller renders "unavailable" rather than "$0" —
 * the difference between "nobody is paying" and "we could not ask" matters.
 */

export interface RevenueSnapshot {
  /** False when Stripe is unconfigured or unreachable. Never render $0 then. */
  available: boolean
  /** Total MRR in cents across active + trialing subscriptions. */
  mrrCents: number
  /** Subscriptions actually being billed. */
  paidCount: number
  /** Paid subscriptions per membership tier. */
  paidByTier: Record<TierKey, number>
  /** MRR in cents per membership tier. */
  mrrByTier: Record<TierKey, number>
  /** Members holding a paid tier with NO Stripe subscription: comps + grants. */
  compedCount: number
  /** Free-tier members. */
  communityCount: number
}

function emptyByTier<T extends number>(value: T): Record<TierKey, T> {
  return { community: value, vip: value, professional: value }
}

export function emptyRevenueSnapshot(available = false): RevenueSnapshot {
  return {
    available,
    mrrCents: 0,
    paidCount: 0,
    paidByTier: emptyByTier(0),
    mrrByTier: emptyByTier(0),
    compedCount: 0,
    communityCount: 0,
  }
}

/** Stripe price id → our membership tier, from the products/prices catalogue. */
async function priceTierMap(): Promise<Map<string, TierKey>> {
  const map = new Map<string, TierKey>()
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (adminClient as any)
      .from('prices')
      .select('stripe_price_id, products!inner(tier)')
      .not('stripe_price_id', 'is', null)
    for (const row of (data ?? []) as Array<{
      stripe_price_id: string
      products: { tier: string | null } | null
    }>) {
      const key = normalizeTierKey(row.products?.tier)
      if (key) map.set(row.stripe_price_id, key)
    }
  } catch {
    // An unmapped price still counts toward total MRR; it just cannot be
    // attributed to a tier. Losing the breakdown beats losing the total.
  }
  return map
}

/** Roster counts that do NOT come from Stripe: comps, grants, free members. */
async function rosterCounts(): Promise<Pick<RevenueSnapshot, 'compedCount' | 'communityCount'>> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (adminClient as any)
      .from('users')
      .select('tier, tier_status, stripe_subscription_id')
    const rows = (data ?? []) as Array<{
      tier: string | null
      tier_status: string | null
      stripe_subscription_id: string | null
    }>
    let compedCount = 0
    let communityCount = 0
    for (const row of rows) {
      const key = normalizeTierKey(row.tier)
      if (key === 'community') communityCount += 1
      // A paid tier with no subscription is access somebody was given, not
      // access somebody bought: a comp code, a guest, or a manual grant.
      else if (key && !row.stripe_subscription_id) compedCount += 1
    }
    return { compedCount, communityCount }
  } catch {
    return { compedCount: 0, communityCount: 0 }
  }
}

/**
 * Every subscription Stripe holds, paged. `status: 'all'` so the inactive ones
 * are visible to the caller rather than silently absent.
 */
async function listAllSubscriptions(): Promise<MrrSubscription[]> {
  const stripe = getStripe()
  const out: MrrSubscription[] = []
  let startingAfter: string | undefined
  // Bounded: 20 pages × 100 is far beyond 99 seats, and an unbounded loop
  // against a paginated API is how an admin page hangs.
  for (let page = 0; page < 20; page += 1) {
    const res = await stripe.subscriptions.list({
      status: 'all',
      limit: 100,
      expand: ['data.items.data.price'],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })
    out.push(...(res.data as unknown as MrrSubscription[]))
    if (!res.has_more || res.data.length === 0) break
    startingAfter = res.data[res.data.length - 1]?.id
  }
  return out
}

export async function getRevenueSnapshot(): Promise<RevenueSnapshot> {
  if (!stripeConfigured()) return emptyRevenueSnapshot(false)

  let subs: MrrSubscription[]
  try {
    subs = await listAllSubscriptions()
  } catch (err) {
    // Code only — a Stripe error message can carry customer detail.
    const code = (err as { code?: string; type?: string }).code ?? (err as { type?: string }).type
    console.error('[Revenue] Stripe subscriptions.list failed', code ?? 'unknown')
    return emptyRevenueSnapshot(false)
  }

  const [byPrice, roster] = await Promise.all([priceTierMap(), rosterCounts()])

  const snapshot = emptyRevenueSnapshot(true)
  snapshot.compedCount = roster.compedCount
  snapshot.communityCount = roster.communityCount

  for (const sub of subs) {
    if (!MRR_STATUSES.has(sub.status)) continue
    const cents = subscriptionMonthlyCents(sub)
    snapshot.mrrCents += cents
    snapshot.paidCount += 1

    // Attribute to a tier via the price the member is actually on.
    const priceId = sub.items?.data?.[0]?.price
      ? (sub.items.data[0].price as unknown as { id?: string }).id
      : undefined
    const tier = priceId ? byPrice.get(priceId) : undefined
    if (tier) {
      snapshot.paidByTier[tier] += 1
      snapshot.mrrByTier[tier] += cents
    }
  }

  return snapshot
}
