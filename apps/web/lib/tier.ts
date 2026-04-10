type Tier = 'vip' | 'community' | 'pro' | null | undefined

const TIER_RANK: Record<string, number> = {
  community: 1,
  vip:       2,
  pro:       3,
}

export function hasTierAccess(userTier: Tier, requiredTier: Tier): boolean {
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
