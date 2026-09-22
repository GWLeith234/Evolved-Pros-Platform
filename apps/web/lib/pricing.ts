/**
 * Pricing — single source of truth for membership tier prices.
 *
 * Display fallback and the annual switch live here. The products/prices
 * catalogue is the live monthly amount when a row exists (see
 * getMembershipPricing). These constants are what a surface shows when the
 * catalogue has no active monthly price, and they are the switch that keeps
 * annual off until a yearly price is actually offered.
 *
 * Canonical (from George, repriced 2026-09-21):
 *   Community           — Free
 *   VIP                 — $99/mo
 *   The Evolved Pros 99 — $849/mo (99 seats, bi-weekly 90-minute mastermind)
 *
 * SPRINT K. The old ladder (VIP $49/$490, Professional $249/$2,490) is dead and
 * all four Stripe prices are archived. Professional is gone as a product; The
 * Evolved Pros 99 replaces it. The internal key stays `professional` here and
 * `pro` in the database — renaming either is Sprint L's job, not a price swap's.
 *
 * ANNUAL IS UNDECIDED, so it is `null`, not a number. That is load-bearing:
 * every surface below renders annual only when it exists, so no page, JSON-LD
 * offer or checkout can quote a yearly price George has not set. A `0` would
 * have displayed "$0/yr"; the old constants would have displayed dead prices.
 */

export type TierKey = 'community' | 'vip' | 'professional'

export interface TierPrice {
  monthly: number
  /** Whole dollars, or null when no annual price is offered for this tier. */
  annual: number | null
}

/** Annual billing gives this many months free vs. paying monthly. */
export const ANNUAL_FREE_MONTHS = 2

export const TIERS: Record<TierKey, TierPrice> = {
  community:    { monthly: 0,   annual: null },
  vip:          { monthly: 99,  annual: null },
  professional: { monthly: 849, annual: null },
}

/** Display name per tier key. `professional` is the key; The 99 is the product. */
export const TIER_DISPLAY_NAMES: Record<TierKey, string> = {
  community: 'Community',
  vip: 'VIP',
  professional: 'The Evolved Pros 99',
}

/** True when any tier currently offers an annual price. Drives the /pricing toggle. */
export function annualBillingAvailable(
  tiers: Record<TierKey, TierPrice> = TIERS,
): boolean {
  return Object.values(tiers).some(t => typeof t.annual === 'number' && t.annual > 0)
}

/**
 * Annual amount to render.
 *
 * A null canonical annual means yearly billing is not offered. A stale
 * catalogue row (the archived $490 / $2,490 prices) must not put a toggle
 * back on the page while /api/stripe/checkout refuses the plan.
 */
export function resolveDisplayedAnnual(
  canonicalAnnual: number | null,
  catalogueCents: number | null | undefined,
): number | null {
  if (canonicalAnnual == null) return null
  if (typeof catalogueCents === 'number') return catalogueCents / 100
  return canonicalAnnual
}

export type PaidPlanKey = 'vip_monthly' | 'vip_annual' | 'pro_monthly' | 'pro_annual'

/**
 * Cents for any checkout that still takes an amount. Null when the plan has no
 * price — today that is both annual plans, until George sets annual pricing.
 */
export function planAmountCents(
  plan: PaidPlanKey,
  tiers: Record<TierKey, TierPrice> = TIERS,
): number | null {
  const dollars =
    plan === 'vip_monthly' ? tiers.vip.monthly
    : plan === 'vip_annual' ? tiers.vip.annual
    : plan === 'pro_monthly' ? tiers.professional.monthly
    : tiers.professional.annual
  return typeof dollars === 'number' ? Math.round(dollars * 100) : null
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

// ── Current-plan marking on /pricing (SPRINT PRICE-1) ───────────────────────

/**
 * The entitlement ladder, low to high. These are lib/tier's TIER_RANK keys
 * ('pro'), not the catalogue's TierKey ('professional') — the two vocabularies
 * differ and this one is the access-control one.
 */
export const TIER_LADDER = ['community', 'vip', 'pro'] as const

export type LadderTier = (typeof TIER_LADDER)[number]

/**
 * Where a pricing card sits relative to the viewer.
 *
 *   'owned' — exactly the viewer's tier → render "Current plan", no buy CTA
 *   'below' — the viewer already outranks it → render "Included", no buy CTA
 *   null    — anonymous, or a genuine upgrade → render the live buy CTA
 *
 * `currentTier` must already be the EFFECTIVE tier (run through effectiveTier),
 * so a churned member sees live CTAs again.
 *
 * Comparison is delegated entirely to hasTierAccess: 'pro' outranks 'vip'
 * because of the shared rank table, never because the strings differ. This is
 * the UI half of the double-billing fix; /api/stripe/checkout enforces the same
 * rule server-side and is the authoritative one.
 */
export function pricingLadderState(
  currentTier: string | null | undefined,
  cardTier: LadderTier | null | undefined,
  hasAccess: (userTier: string | null | undefined, requiredTier: string) => boolean,
): 'owned' | 'below' | null {
  if (!cardTier || !currentTier) return null
  if (!hasAccess(currentTier, cardTier)) return null
  const nextUp = TIER_LADDER[TIER_LADDER.indexOf(cardTier) + 1]
  // Nothing above 'pro', so at-or-above there means owned.
  const outranksThisCard = nextUp ? hasAccess(currentTier, nextUp) : false
  return outranksThisCard ? 'below' : 'owned'
}
