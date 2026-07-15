import 'server-only'
import Stripe from 'stripe'

// ---------------------------------------------------------------------------
// Stripe integration — SPRINT I Phase 1 (TEST MODE)
//
// Strangler pattern: this lives alongside the legacy Vendasta checkout
// (/api/checkout) and is not wired live until a test-mode purchase is proven
// to round-trip to a tier change. Live keys / real charges are George's — the
// code only ever reads STRIPE_* env vars, which in this phase are test-mode.
//
// Price *amounts* deliberately live in the Stripe dashboard (test mode), NOT
// in this file. We reference prices by env-configured price id only, so the
// commerce catalogue stays out of the codebase (and off the pricing-copy
// inconsistency Design owns).
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

// Plan key → { tier, interval, price env var }. One env var per plan; the
// value is a Stripe (test-mode) price id.
export const PLAN_CATALOG: Record<PlanKey, PlanDef> = {
  vip_monthly: { tier: 'vip', interval: 'month', priceEnvVar: 'STRIPE_PRICE_VIP_MONTHLY' },
  vip_annual:  { tier: 'vip', interval: 'year',  priceEnvVar: 'STRIPE_PRICE_VIP_ANNUAL' },
  pro_monthly: { tier: 'pro', interval: 'month', priceEnvVar: 'STRIPE_PRICE_PRO_MONTHLY' },
  pro_annual:  { tier: 'pro', interval: 'year',  priceEnvVar: 'STRIPE_PRICE_PRO_ANNUAL' },
}

export function isPlanKey(v: unknown): v is PlanKey {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(PLAN_CATALOG, v)
}

/** plan → configured Stripe price id, or null if the env var isn't set. */
export function priceIdForPlan(plan: PlanKey): string | null {
  return process.env[PLAN_CATALOG[plan].priceEnvVar] ?? null
}

/** Reverse map for the webhook: Stripe price id → tier (null if unknown). */
export function tierForPriceId(priceId: string): Tier | null {
  for (const def of Object.values(PLAN_CATALOG)) {
    if (process.env[def.priceEnvVar] === priceId) return def.tier
  }
  return null
}
