/**
 * Repurchase guard (SPRINT PRICE-1).
 *
 * /pricing is the only checkout surface and it had no idea who was looking at
 * it, so an existing VIP could click "Start VIP" and open a SECOND subscription
 * against the same Stripe customer. The webhook writes tier from session
 * metadata, so the database looks perfectly healthy while the member is billed
 * twice. The UI fix alone is not enough — /api/stripe/checkout is directly
 * reachable — so the authoritative check lives here and is called by the route.
 *
 * Pure and dependency-free so it can be unit-tested; the route supplies the
 * profile fields.
 */

import { effectiveTier, hasTierAccess } from '@/lib/tier'
import { PLAN_CATALOG, type PlanKey } from './config'

/**
 * Does this member ALREADY have entitlement at or above the plan they are
 * trying to buy?
 *
 * Comparison goes through effectiveTier() first, so a dead subscription
 * (canceled / unpaid) correctly drops the member to community and lets them
 * re-purchase the same tier — the difference between "you already have this"
 * and "you used to have this" is the whole point of the status check.
 *
 * Then hasTierAccess() does the ranking, never a string compare: 'pro' blocks a
 * 'vip' purchase because pro outranks vip, not because the strings differ.
 */
export function alreadyEntitledTo(
  tier: string | null | undefined,
  tierStatus: string | null | undefined,
  plan: PlanKey,
): boolean {
  const current = effectiveTier(tier, tierStatus)
  if (!current) return false
  return hasTierAccess(current, PLAN_CATALOG[plan].tier)
}

/** The tier a plan key grants — 'vip' or 'pro'. */
export function planTier(plan: PlanKey): string {
  return PLAN_CATALOG[plan].tier
}
