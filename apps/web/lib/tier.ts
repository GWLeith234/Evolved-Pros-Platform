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

/** Returns true if the user has purchased Keynote access OR is on the Pro tier. */
export function hasKeynoteAccess(user: { keynote_access?: boolean | null; tier?: string | null }): boolean {
  return user.keynote_access === true || user.tier?.toLowerCase() === 'pro'
}

export function isActiveMember(tierStatus: string | null | undefined): boolean {
  return tierStatus === 'active' || tierStatus === 'trial'
}
