import 'server-only'
import Stripe from 'stripe'

// ---------------------------------------------------------------------------
// Stripe integration — LIVE MODE.
//
// SPRINT K corrected this header. It read "SPRINT I Phase 1 (TEST MODE)" while
// STRIPE_SECRET_KEY in Railway production has been sk_live_ for months: four
// cs_live_ checkout sessions exist, created by this code. Nothing about the
// integration is test mode; only the comment was.
//
// Price *amounts* deliberately live in Stripe, NOT in this file. We reference
// prices by id — from the products/prices catalogue first, these env vars as
// the fallback — so the commerce catalogue stays out of the codebase.
// ---------------------------------------------------------------------------

// Lazy singleton — instantiated on first use so a build / type-check without
// STRIPE_SECRET_KEY (preview, CI) doesn't throw at import time.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  _stripe = new Stripe(key)
  return _stripe
}

/** True when the Stripe path is configured (secret key present). */
export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export type Tier = 'community' | 'vip' | 'pro'
export type PlanKey = 'vip_monthly' | 'vip_annual' | 'pro_monthly' | 'pro_annual'
export type BillingInterval = 'month' | 'year'

interface PlanDef {
  tier: Exclude<Tier, 'community'>
  interval: BillingInterval
  priceEnvVar: string
}

// Plan key → { tier, interval, price env var }. Checkout sells the monthly
// prices George creates for this reshape. Annual env vars stay, and annual
// checkout stays refused while TIERS.*.annual is null.
// TODO(George): annual billing on, or remove the toggle. Leave it off.
export const PLAN_CATALOG: Record<PlanKey, PlanDef> = {
  vip_monthly: { tier: 'vip', interval: 'month', priceEnvVar: 'STRIPE_PRICE_VIP_MONTHLY_149' },
  vip_annual:  { tier: 'vip', interval: 'year',  priceEnvVar: 'STRIPE_PRICE_VIP_ANNUAL' },
  pro_monthly: { tier: 'pro', interval: 'month', priceEnvVar: 'STRIPE_PRICE_PRO_MONTHLY_599' },
  pro_annual:  { tier: 'pro', interval: 'year',  priceEnvVar: 'STRIPE_PRICE_PRO_ANNUAL' },
}

/**
 * Legacy Stripe price env vars. Webhook resolution only.
 * Never delete these. Existing subscribers stay on the old price ids.
 *
 *   STRIPE_PRICE_VIP_MONTHLY       VIP $99/mo (the previous live price)
 *   STRIPE_PRICE_VIP_MONTHLY_99    alias for that $99 price, if set separately
 *   STRIPE_PRICE_VIP_MONTHLY_49    archived VIP $49/mo
 *   STRIPE_PRICE_VIP_ANNUAL        archived VIP $490/yr (also the unsold annual plan)
 *   STRIPE_PRICE_VIP_ANNUAL_490    alias for the archived annual
 *   STRIPE_PRICE_PRO_MONTHLY       The 99 $849/mo (the previous live price)
 *   STRIPE_PRICE_PRO_MONTHLY_849   alias for that $849 price
 *   STRIPE_PRICE_PRO_MONTHLY_249   archived The 99 $249/mo
 *   STRIPE_PRICE_PRO_ANNUAL        archived The 99 $2,490/yr
 *   STRIPE_PRICE_PRO_ANNUAL_2490   alias for the archived annual
 */
export const LEGACY_PRICE_ENV: Record<string, Exclude<Tier, 'community'>> = {
  STRIPE_PRICE_VIP_MONTHLY: 'vip',
  STRIPE_PRICE_VIP_MONTHLY_99: 'vip',
  STRIPE_PRICE_VIP_MONTHLY_49: 'vip',
  STRIPE_PRICE_VIP_ANNUAL: 'vip',
  STRIPE_PRICE_VIP_ANNUAL_490: 'vip',
  STRIPE_PRICE_PRO_MONTHLY: 'pro',
  STRIPE_PRICE_PRO_MONTHLY_849: 'pro',
  STRIPE_PRICE_PRO_MONTHLY_249: 'pro',
  STRIPE_PRICE_PRO_ANNUAL: 'pro',
  STRIPE_PRICE_PRO_ANNUAL_2490: 'pro',
}

export function isPlanKey(v: unknown): v is PlanKey {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(PLAN_CATALOG, v)
}

/** plan → configured Stripe price id, or null if the env var isn't set. */
export function priceIdForPlan(plan: PlanKey): string | null {
  return process.env[PLAN_CATALOG[plan].priceEnvVar] ?? null
}

/**
 * Every configured price id that draws on a tier: the price checkout sells
 * and every legacy price still on a subscriber. Seat counting must include
 * both, or a member on $849 would not count toward the 99.
 */
export function configuredPriceIdsForTier(tier: Tier): string[] {
  if (tier === 'community') return []
  const names = new Set<string>()
  for (const def of Object.values(PLAN_CATALOG)) {
    if (def.tier === tier) names.add(def.priceEnvVar)
  }
  for (const [name, mapped] of Object.entries(LEGACY_PRICE_ENV)) {
    if (mapped === tier) names.add(name)
  }
  const ids: string[] = []
  for (const name of names) {
    const id = process.env[name]?.trim()
    if (id) ids.push(id)
  }
  return ids
}

/** Reverse map for the webhook: Stripe price id → tier (null if unknown). */
export function tierForPriceId(priceId: string): Tier | null {
  const needle = priceId.trim()
  if (!needle) return null
  for (const def of Object.values(PLAN_CATALOG)) {
    if (process.env[def.priceEnvVar]?.trim() === needle) return def.tier
  }
  for (const [name, tier] of Object.entries(LEGACY_PRICE_ENV)) {
    if (process.env[name]?.trim() === needle) return tier
  }
  return null
}
