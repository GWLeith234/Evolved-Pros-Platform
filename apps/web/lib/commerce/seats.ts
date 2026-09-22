import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { getStripe, PLAN_CATALOG, priceIdForPlan, stripeConfigured, type PlanKey } from '@/lib/stripe/config'
import { unionSeatPriceIds } from '@/lib/commerce/seatPriceIds'
import { MRR_STATUSES } from '@/lib/stripe/mrr'
import type { MembershipTier } from '@/lib/commerce/catalogue'

/**
 * Seat counting for capped products (SPRINT L).
 *
 * THE COUNT IS LIVE SUBSCRIPTIONS, NOT SALES. A cancelled seat returns to the
 * pool, so counting all-time checkouts would permanently shrink the room every
 * time somebody churned. Stripe is asked directly rather than counting
 * users.stripe_subscription_id, because that column is written by the webhook
 * and a webhook that has not landed yet is exactly when the count matters.
 *
 * FAILS CLOSED. If the cap cannot be established, `soldOut` is true and
 * checkout refuses. Selling seat 100 is a promise the product cannot keep -
 * somebody paid $849 for a room that is full - and is much worse than making a
 * buyer try again in a minute.
 */

export interface SeatStatus {
  /** Whether the seat count is trustworthy. False means we could not ask. */
  known: boolean
  /** null = uncapped product. */
  cap: number | null
  /** Live (active or trialing) subscriptions against this product's prices. */
  taken: number
  /** null when uncapped. Never negative. */
  remaining: number | null
  /** True when a new purchase must be refused. Uncapped products are never sold out. */
  soldOut: boolean
}

export function uncappedSeats(): SeatStatus {
  return { known: true, cap: null, taken: 0, remaining: null, soldOut: false }
}

/** Fail-closed status used when the cap or the count cannot be resolved. */
function unknownSeats(cap: number | null): SeatStatus {
  return { known: false, cap, taken: 0, remaining: cap === null ? null : 0, soldOut: true }
}

interface CappedProduct {
  id: string
  slug: string
  name: string
  seat_cap: number | null
  stripePriceIds: string[]
}

/**
 * The product row for a membership tier, with its cap and every Stripe price
 * id that draws on it. Prices are collected regardless of `active` so a seat
 * bought on a now-archived price still counts - the member is in the room.
 */
export async function cappedProductForTier(
  tier: MembershipTier,
): Promise<CappedProduct | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (adminClient as any)
      .from('products')
      .select('id, slug, name, seat_cap, prices(stripe_price_id)')
      .eq('tier', tier)
      .eq('kind', 'membership')
      .maybeSingle()
    if (error || !data) return null
    const row = data as {
      id: string
      slug: string
      name: string
      seat_cap: number | null
      prices: Array<{ stripe_price_id: string | null }> | null
    }
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      seat_cap: row.seat_cap,
      stripePriceIds: (row.prices ?? [])
        .map(p => p.stripe_price_id)
        .filter((id): id is string => Boolean(id)),
    }
  } catch {
    return null
  }
}

/**
 * How many live Stripe subscriptions sit on any of these price ids.
 *
 * Stripe's list endpoint filters by a single price, so each price is asked
 * separately and the subscription ids are unioned - a subscription carrying two
 * of our prices must count once, not twice.
 */
async function countLiveSubscriptions(priceIds: readonly string[]): Promise<number | null> {
  if (priceIds.length === 0) return 0
  if (!stripeConfigured()) return null

  const stripe = getStripe()
  const seen = new Set<string>()
  try {
    for (const price of priceIds) {
      let startingAfter: string | undefined
      // Bounded, as in lib/stripe/revenue.ts: 99 seats never needs 20 pages.
      for (let page = 0; page < 20; page += 1) {
        const res = await stripe.subscriptions.list({
          price,
          status: 'all',
          limit: 100,
          ...(startingAfter ? { starting_after: startingAfter } : {}),
        })
        for (const sub of res.data) {
          if (MRR_STATUSES.has(sub.status)) seen.add(sub.id)
        }
        if (!res.has_more || res.data.length === 0) break
        startingAfter = res.data[res.data.length - 1]?.id
      }
    }
  } catch (err) {
    // Code only; a Stripe message can carry customer detail.
    const code = (err as { code?: string; type?: string }).code ?? (err as { type?: string }).type
    console.error('[Seats] subscriptions.list failed', code ?? 'unknown')
    return null
  }
  return seen.size
}

/** Seat status for a membership tier. Uncapped tiers short-circuit. */
export async function seatStatusForTier(tier: MembershipTier): Promise<SeatStatus> {
  const product = await cappedProductForTier(tier)
  if (!product) {
    // No product row means we cannot know whether a cap applies.
    console.warn('[Seats] no membership product row for tier', tier)
    return unknownSeats(null)
  }
  if (product.seat_cap === null) return uncappedSeats()

  // Catalogue ids (including archived prices, so a seated member still counts)
  // plus the env price checkout falls back to. Empty means we cannot tell a
  // full room from an empty one, so this fails closed.
  const priceIds = unionSeatPriceIds(product.stripePriceIds, envPriceIdsForTier(tier))
  if (priceIds.length === 0) {
    console.warn('[Seats] capped product has no Stripe price ids', tier)
    return unknownSeats(product.seat_cap)
  }

  const taken = await countLiveSubscriptions(priceIds)
  if (taken === null) return unknownSeats(product.seat_cap)

  const remaining = Math.max(0, product.seat_cap - taken)
  return {
    known: true,
    cap: product.seat_cap,
    taken,
    remaining,
    soldOut: remaining <= 0,
  }
}

function envPriceIdsForTier(tier: MembershipTier): string[] {
  if (tier === 'community') return []
  const ids: string[] = []
  for (const plan of Object.keys(PLAN_CATALOG) as PlanKey[]) {
    if (PLAN_CATALOG[plan].tier !== tier) continue
    const id = priceIdForPlan(plan)
    if (id) ids.push(id)
  }
  return ids
}

/** Seat status for every capped membership product, for the admin surface. */
export async function allSeatStatuses(): Promise<
  Array<{ tier: MembershipTier; name: string; status: SeatStatus; waiting: number }>
> {
  const out: Array<{ tier: MembershipTier; name: string; status: SeatStatus; waiting: number }> = []
  for (const tier of ['vip', 'pro'] as const) {
    const product = await cappedProductForTier(tier)
    if (!product || product.seat_cap === null) continue
    const [status, waiting] = await Promise.all([
      seatStatusForTier(tier),
      countWaiting(product.id),
    ])
    out.push({ tier, name: product.name, status, waiting })
  }
  return out
}

async function countWaiting(productId: string): Promise<number> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (adminClient as any)
      .from('seat_waitlist')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)
      .in('status', ['waiting', 'offered'])
    return count ?? 0
  } catch {
    return 0
  }
}

// ── Waitlist ───────────────────────────────────────────────────────────────

/**
 * Put a member in line for a sold-out seat. Idempotent: the partial unique
 * index keeps one open row per (product, user), and a repeat attempt keeps the
 * member's original position rather than moving them to the back.
 *
 * Best-effort by design. A waitlist write must never turn a clean "sold out"
 * answer into a 500 - the member still needs to be told the room is full.
 */
export async function joinSeatWaitlist(opts: {
  tier: MembershipTier
  userId: string
  email: string
  fullName?: string | null
  source: 'checkout' | 'webhook' | 'admin'
  notes?: string | null
}): Promise<'joined' | 'already-waiting' | 'failed'> {
  const product = await cappedProductForTier(opts.tier)
  if (!product) return 'failed'
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (adminClient as any).from('seat_waitlist').insert({
      product_id: product.id,
      user_id: opts.userId,
      email: opts.email.trim().toLowerCase(),
      full_name: opts.fullName ?? null,
      status: 'waiting',
      source: opts.source,
      notes: opts.notes ?? null,
    })
    if (!error) return 'joined'
    // 23505 = unique violation: they are already in line, which is a success
    // from the member's point of view.
    if ((error as { code?: string }).code === '23505') return 'already-waiting'
    console.error('[Seats] waitlist insert failed', (error as { code?: string }).code)
    return 'failed'
  } catch {
    return 'failed'
  }
}
