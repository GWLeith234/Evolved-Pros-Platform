type Tier = 'community' | 'pro' | null | undefined

const TIER_RANK: Record<string, number> = {
  community: 1,
  pro:       2,
}

export function hasTierAccess(userTier: Tier, requiredTier: Tier): boolean {
  if (!requiredTier) return true
  if (!userTier) return false
  return (TIER_RANK[userTier] ?? 0) >= (TIER_RANK[requiredTier] ?? 0)
}

export function isActiveMember(tierStatus: string | null | undefined): boolean {
  return tierStatus === 'active' || tierStatus === 'trial'
}
