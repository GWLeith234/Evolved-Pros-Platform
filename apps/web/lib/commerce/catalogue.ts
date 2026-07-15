import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { TIERS, type TierKey } from '@/lib/pricing'

// ---------------------------------------------------------------------------
// Commerce catalogue — SPRINT I Phase 2.
// Reads the own products / prices schema (source of truth). Replaces the
// hardcoded lib/admin/products defaults + platform_settings + Vendasta SKUs.
// ---------------------------------------------------------------------------

export type ProductKind = 'membership' | 'live_event' | 'high_ticket'
export type PriceInterval = 'month' | 'year' | 'one_time'
export type MembershipTier = 'community' | 'vip' | 'pro'

export interface CataloguePrice {
  id: string
  interval: PriceInterval
  unit_amount: number // minor units (cents)
  currency: string
  active: boolean
  stripe_price_id: string | null
}

export interface CatalogueProduct {
  id: string
  slug: string
  name: string
  description: string | null
  kind: ProductKind
  tier: MembershipTier | null
  active: boolean
  sort_order: number
  stripe_product_id: string | null
  prices: CataloguePrice[]
}

interface RawPrice {
  id: string
  product_id: string
  interval: PriceInterval
  unit_amount: number
  currency: string
  active: boolean
  stripe_price_id: string | null
}

/**
 * Full catalogue (all products, active first then by sort_order) with their
 * prices nested. Two flat queries + an in-memory join keeps it to one round
 * trip per table (no N+1).
 */
export async function getCatalogue(): Promise<CatalogueProduct[]> {
  const [{ data: products }, { data: prices }] = await Promise.all([
    (adminClient as any)
      .from('products')
      .select('id, slug, name, description, kind, tier, active, sort_order, stripe_product_id')
      .order('sort_order', { ascending: true }),
    (adminClient as any)
      .from('prices')
      .select('id, product_id, interval, unit_amount, currency, active, stripe_price_id')
      .order('unit_amount', { ascending: true }),
  ])

  const byProduct = new Map<string, CataloguePrice[]>()
  for (const p of (prices ?? []) as RawPrice[]) {
    const list = byProduct.get(p.product_id) ?? []
    list.push({
      id: p.id,
      interval: p.interval,
      unit_amount: p.unit_amount,
      currency: p.currency,
      active: p.active,
      stripe_price_id: p.stripe_price_id,
    })
    byProduct.set(p.product_id, list)
  }

  return ((products ?? []) as Omit<CatalogueProduct, 'prices'>[]).map(prod => ({
    ...prod,
    prices: byProduct.get(prod.id) ?? [],
  }))
}

/**
 * Resolve the Stripe price id for a membership (tier + interval) from the
 * catalogue. Returns null when the catalogue has no active, Stripe-linked
 * price for that combination — the caller can then fall back to env config.
 */
export async function resolveStripePriceId(
  tier: MembershipTier,
  interval: Extract<PriceInterval, 'month' | 'year'>,
): Promise<string | null> {
  const { data } = await (adminClient as any)
    .from('prices')
    .select('stripe_price_id, products!inner(tier)')
    .eq('products.tier', tier)
    .eq('interval', interval)
    .eq('active', true)
    .not('stripe_price_id', 'is', null)
    .maybeSingle()
  return (data?.stripe_price_id as string | undefined) ?? null
}

/**
 * Reverse of resolveStripePriceId: a Stripe price id → the membership tier it
 * belongs to, via the catalogue. Used by the webhook to key tier updates off
 * our schema. Returns null when the price id isn't in the catalogue.
 */
export async function tierForStripePriceId(priceId: string): Promise<MembershipTier | null> {
  const { data } = await (adminClient as any)
    .from('prices')
    .select('products!inner(tier)')
    .eq('stripe_price_id', priceId)
    .maybeSingle()
  const tier = (data?.products as { tier?: MembershipTier } | undefined)?.tier
  return tier ?? null
}

/**
 * Monthly membership prices (whole dollars) keyed by the lib/pricing TierKey,
 * sourced from the catalogue's active monthly prices — so MRR reflects any
 * admin price edit. Falls back to the lib/pricing constants per tier when the
 * catalogue lacks an active monthly price. This is the single price source for
 * MRR (dashboard + revenue).
 */
export async function getMrrMonthlyByTierKey(): Promise<Record<TierKey, number>> {
  const map: Record<TierKey, number> = {
    community: TIERS.community.monthly,
    vip: TIERS.vip.monthly,
    professional: TIERS.professional.monthly,
  }
  const { data } = await (adminClient as any)
    .from('prices')
    .select('unit_amount, active, interval, products!inner(tier)')
    .eq('interval', 'month')
    .eq('active', true)

  for (const row of (data ?? []) as Array<{ unit_amount: number; products: { tier: MembershipTier | null } }>) {
    const tier = row.products?.tier
    const dollars = row.unit_amount / 100
    if (tier === 'vip') map.vip = dollars
    else if (tier === 'pro') map.professional = dollars
    else if (tier === 'community') map.community = dollars
  }
  return map
}
