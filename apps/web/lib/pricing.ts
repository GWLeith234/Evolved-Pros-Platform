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
 * tier_status values that represent a NON-paying grant, i.e. access without
 * revenue. 'comp' is the guest persona (comped Professional access, no Stripe
 * subscription); 'cancelled'/'expired' are lapsed subscriptions. Anything here
 * contributes $0 to MRR.
 */
export const NON_REVENUE_TIER_STATUSES: ReadonlySet<string> = new Set([
  'cancelled',
  'expired',
  'comp',
])

/**
 * Monthly revenue contribution of a single member. Mirrors the prior
 * getTierMrr gating: a subscription only counts when it has a live status
 * (anything other than missing / cancelled / expired / comp).
 *
 * REVENUE HYGIENE: the guest persona is tier='pro', tier_status='comp' with no
 * Stripe subscription. Because 'comp' is in NON_REVENUE_TIER_STATUSES, a guest
 * always returns 0 here — which propagates to computeMrr, getTierMrr and every
 * admin revenue/stats surface built on them. The canonical "actually paying"
 * predicate as Stripe rolls out is `stripe_subscription_id IS NOT NULL` (see
 * isRevenueMember); today no rows carry a subscription id yet, so MRR still
 * prices off tier — the comp/guest exclusions are what protect the numbers.
 */
export function tierMonthlyPrice(
  tier: string | null | undefined,
  tierStatus?: string | null,
  isComped?: boolean,
  // Optional monthly-dollars-by-tier override. When supplied (e.g. from the
  // catalogue via getMrrMonthlyByTierKey), it wins over the TIERS constants so
  // MRR reflects live admin price edits. Falls back to TIERS per tier.
  monthlyByKey?: Partial<Record<TierKey, number>>,
): number {
  // Comped members (e.g. "Friends of George", guests) have full tier access but
  // pay $0, so a comp must never contribute to MRR regardless of tier/status.
  if (isComped) return 0
  if (tierStatus !== undefined) {
    if (!tierStatus || NON_REVENUE_TIER_STATUSES.has(tierStatus)) return 0
  }
  const key = normalizeTierKey(tier)
  if (!key) return 0
  return monthlyByKey?.[key] ?? TIERS[key].monthly
}

export interface MrrMember {
  tier: string | null
  tier_status: string | null
  /**
   * Set when the member holds a comp code (free tier grant). Excluded from
   * MRR — a comped Pro is full-access but $0 revenue.
   */
  comp_promo_code_id?: string | null
  /**
   * Persona. A 'guest' is comped Professional access (podcast/keynote guest)
   * and never contributes revenue, independent of tier/tier_status.
   */
  role?: string | null
  /**
   * Live Stripe subscription id. The forward-looking canonical "is paying"
   * signal — a guest/comp never has one. See isRevenueMember.
   */
  stripe_subscription_id?: string | null
}

/**
 * Whether a member should be counted as paying revenue. Guests and comps are
 * excluded regardless of tier. Once every paying member carries a Stripe
 * subscription this can tighten to simply `Boolean(m.stripe_subscription_id)`;
 * until then we exclude the known non-revenue personas (guest / comp / lapsed).
 */
export function isRevenueMember(m: MrrMember): boolean {
  if ((m.role ?? '').toLowerCase() === 'guest') return false
  if (m.comp_promo_code_id) return false
  const s = m.tier_status
  if (!s || NON_REVENUE_TIER_STATUSES.has(s)) return false
  return normalizeTierKey(m.tier) !== null
}

/**
 * Total monthly recurring revenue across a member list (active/trial, comps and
 * guests excluded). Pass `monthlyByKey` (from the catalogue) to price off the
 * live catalogue rather than the TIERS constants.
 */
export function computeMrr(
  members: MrrMember[],
  monthlyByKey?: Partial<Record<TierKey, number>>,
): number {
  return members.reduce((sum, m) => {
    // Guests are comped Professional — never revenue, even if a future
    // tier_status slips past the tierMonthlyPrice gate.
    if ((m.role ?? '').toLowerCase() === 'guest') return sum
    return sum + tierMonthlyPrice(m.tier, m.tier_status, Boolean(m.comp_promo_code_id), monthlyByKey)
  }, 0)
}
