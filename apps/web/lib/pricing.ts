/**
 * Pricing — single source of truth for membership tier prices.
 *
 * There is no products/prices table and no platform_settings price keys; prices
 * used to live hardcoded (and inconsistently) across the pricing page, admin
 * products, admin revenue, and the admin dashboard MRR calc. Everything now
 * reads from here.
 *
 * Canonical (from George):
 *   Community    — Free
 *   VIP          — $49/mo  ($490/yr)
 *   Professional — $249/mo ($2,490/yr)
 * Annual = 2 months free = monthly × (12 − ANNUAL_FREE_MONTHS).
 */

export type TierKey = 'community' | 'vip' | 'professional'

export interface TierPrice {
  monthly: number
  annual: number
}

/** Annual billing gives this many months free vs. paying monthly. */
export const ANNUAL_FREE_MONTHS = 2

export const TIERS: Record<TierKey, TierPrice> = {
  community:    { monthly: 0,   annual: 0 },
  vip:          { monthly: 49,  annual: 490 },
  professional: { monthly: 249, annual: 2490 },
}

/**
 * Normalize a stored/loose tier string to a canonical key. The DB
 * (users.tier) and the admin products catalog store the professional tier as
 * `'pro'`; the CRM uses `'professional'`. Both map here.
 */
export function normalizeTierKey(tier: string | null | undefined): TierKey | null {
  const t = (tier ?? '').toLowerCase()
  if (t === 'pro' || t === 'professional') return 'professional'
  if (t === 'vip') return 'vip'
  if (t === 'community') return 'community'
  return null
}

/**
 * Monthly revenue contribution of a single member. Mirrors the prior
 * getTierMrr gating: a subscription only counts when it has a live status
 * (anything other than missing / cancelled / expired).
 */
export function tierMonthlyPrice(
  tier: string | null | undefined,
  tierStatus?: string | null,
): number {
  if (tierStatus !== undefined) {
    if (!tierStatus || tierStatus === 'cancelled' || tierStatus === 'expired') return 0
  }
  const key = normalizeTierKey(tier)
  return key ? TIERS[key].monthly : 0
}

export interface MrrMember {
  tier: string | null
  tier_status: string | null
}

/** Total monthly recurring revenue across a member list (active/trial only). */
export function computeMrr(members: MrrMember[]): number {
  return members.reduce((sum, m) => sum + tierMonthlyPrice(m.tier, m.tier_status), 0)
}
