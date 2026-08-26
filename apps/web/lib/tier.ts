// Inputs are widened to `string | null | undefined` because the values come
// straight from DB columns typed as `string | null` (e.g. profiles.tier,
// events.required_tier). The body already coerces any unrecognized string to
// rank 0 via TIER_RANK[...] ?? 0, so accepting plain strings is correct and
// avoids a cast at every call site. Body unchanged — emitted JS is identical.
type TierInput = 'vip' | 'community' | 'pro' | string | null | undefined

const TIER_RANK: Record<string, number> = {
  community: 1,
  vip:       2,
  pro:       3,
}

export function hasTierAccess(userTier: TierInput, requiredTier: TierInput): boolean {
  if (!requiredTier) return true
  if (!userTier) return false
  const ut = userTier.toLowerCase()
  const rt = requiredTier.toLowerCase()
  return (TIER_RANK[ut] ?? 0) >= (TIER_RANK[rt] ?? 0)
}

// tier_status values (case-insensitive) that mean the paid subscription is
// DEAD, so the member drops to community-tier access. The column carries a
// MIXED vocabulary — Stripe statuses (active, past_due, unpaid, canceled,
// incomplete, trialing) AND legacy Vendasta values ('expired') — so this is an
// explicit allow-list of "deny" statuses, never a catch-all.
//
// Both 'canceled' (Stripe's US spelling) and 'cancelled' (UK) are listed
// because we do not assume which Stripe emits.
const DEAD_SUBSCRIPTION_STATUSES = new Set(['unpaid', 'canceled', 'cancelled', 'expired'])

/**
 * The tier a member is actually entitled to right now, given their raw tier and
 * subscription status. Returns 'community' when tier_status marks the paid
 * subscription dead; otherwise returns the tier unchanged.
 *
 * FAILS OPEN on everything else, by design — NULL, 'active', 'past_due'
 * (grace window), and any unrecognised value all keep the member's tier.
 * Legacy Vendasta `'expired'` is dead: the member layout already sends
 * those accounts to /membership-expired, so treating them as still-entitled
 * blocked renewals (pricing showed "Current plan", checkout 409'd).
 * Locking out a real member on an *unknown* status is still worse than a
 * short window of unpaid access, so a missing/unrecognised status never
 * removes access.
 */
export function effectiveTier(
  tier: string | null | undefined,
  tierStatus: string | null | undefined,
): string | null {
  const status = tierStatus?.toLowerCase()
  if (status && DEAD_SUBSCRIPTION_STATUSES.has(status)) return 'community'
  return tier ?? null
}
