/**
 * Friends of George (FOG) — complimentary membership flag.
 *
 * Backed by the existing `users.comp_promo_code_id` column (migration 062)
 * and the seeded FRIENDSOFGEORGE promo code. This is NOT paid VIP and is
 * NOT inferred from $0 / "No MRR" (owner accounts and unpaid PRO stay unmarked).
 *
 * Admins set the flag explicitly through the member edit flow. Nothing here
 * backfills or invents who is FOG.
 */

export const FOG_PROMO_CODE = 'FRIENDSOFGEORGE'
export const FOG_LABEL = 'FOG'
export const FOG_TITLE = 'Friends of George — complimentary, excluded from MRR. Not a paid VIP plan.'

/** Gold palette matching the admin VIP chip, labeled FOG so the two cannot be confused. */
export const FOG_BADGE = {
  bg: 'rgba(201,168,76,0.15)',
  color: '#a07c1e',
  border: 'rgba(201,168,76,0.45)',
  label: FOG_LABEL,
} as const

export const MEMBER_FILTERS = ['All', 'Pro', 'VIP', 'FOG', 'Guest', 'Trial', 'Cancelled'] as const
export type MemberFilter = (typeof MEMBER_FILTERS)[number]

export type FogFlagSource = {
  isComped?: boolean
  compPromoCodeId?: string | null
  comp_promo_code_id?: string | null
}

/** True only when the stored complimentary flag is set. Never inferred from MRR. */
export function isFogMember(m: FogFlagSource | null | undefined): boolean {
  if (!m) return false
  if (m.isComped === true) return true
  if (m.compPromoCodeId) return true
  if (m.comp_promo_code_id) return true
  return false
}

export type PlanBadgeKind = 'guest' | 'fog' | 'tier'

export function memberPlanBadges(m: {
  role?: string | null
  tier?: string | null
  isComped?: boolean
  compPromoCodeId?: string | null
  comp_promo_code_id?: string | null
}): Array<{ kind: PlanBadgeKind; label: string }> {
  const badges: Array<{ kind: PlanBadgeKind; label: string }> = []
  if (m.role === 'guest') badges.push({ kind: 'guest', label: 'GUEST' })
  if (isFogMember(m)) badges.push({ kind: 'fog', label: FOG_LABEL })
  if (m.tier) badges.push({ kind: 'tier', label: m.tier.toUpperCase() })
  return badges
}

export function matchesMemberFilter(
  m: {
    tier: string | null
    role: string | null
    tierStatus: string | null
    isComped?: boolean
    compPromoCodeId?: string | null
    comp_promo_code_id?: string | null
  },
  filter: MemberFilter,
): boolean {
  if (filter === 'All') return true
  if (filter === 'Pro') return m.tier === 'pro' && m.role !== 'guest'
  if (filter === 'VIP') return m.tier === 'vip'
  if (filter === 'FOG') return isFogMember(m)
  if (filter === 'Guest') return m.role === 'guest'
  if (filter === 'Trial') return m.tierStatus === 'trial'
  if (filter === 'Cancelled') return m.tierStatus === 'cancelled' || m.tierStatus === 'expired'
  return true
}

/**
 * Map the admin-edit boolean onto `users.comp_promo_code_id`.
 * Does not invent a roster — the caller must pass the seeded FOG promo id.
 */
export function friendsOfGeorgeToCompPromoCodeId(
  friendsOfGeorge: boolean,
  fogPromoCodeId: string | null | undefined,
): { value: string | null } | { error: string } {
  if (!friendsOfGeorge) return { value: null }
  if (!fogPromoCodeId) {
    return { error: 'Friends of George promo code is not configured.' }
  }
  return { value: fogPromoCodeId }
}

export function shouldApplyFriendsOfGeorge(body: { friends_of_george?: unknown }): boolean {
  return typeof body.friends_of_george === 'boolean'
}
