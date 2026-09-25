/**
 * Paid-period access.
 *
 * George, locked: a member can cancel anytime, keeps the tier they paid for
 * until `tier_expires_at`, and then drops to community. No refunds, no prorates.
 * Comps (`tier_status = 'comp'` or `comp_promo_code_id`) and admins keep their
 * tier no matter what date is stored. `past_due` stays in the Stripe grace
 * window until `customer.subscription.deleted` — a failed renewal retry is not
 * this downgrade.
 */

export type MemberPeriodRow = {
  tier?: string | null
  tier_status?: string | null
  tier_expires_at?: string | null
  role?: string | null
  comp_promo_code_id?: string | null
}

export type MemberAccessContext = {
  tierExpiresAt?: string | null
  role?: string | null
  compPromoCodeId?: string | null
  now?: Date
}

export type PlannedTierAudit = {
  old_tier: string | null
  new_tier: 'community'
  old_tier_status: string | null
  new_tier_status: string
  /** Matches private.users_audit_privilege_change: one row, columns joined. */
  direction: 'tier' | 'tier,tier_status'
}

const DEAD_SUBSCRIPTION_STATUSES = new Set(['unpaid', 'canceled', 'cancelled', 'expired'])

const DOWNGRADE_STATUSES = new Set(['active', 'trial', 'cancelled', 'canceled', 'expired'])

export function isPaidTier(tier: string | null | undefined): boolean {
  const t = (tier ?? '').toLowerCase()
  return t === 'vip' || t === 'pro'
}

export function isCompMember(row: Pick<MemberPeriodRow, 'tier_status' | 'comp_promo_code_id'>): boolean {
  if ((row.tier_status ?? '').toLowerCase() === 'comp') return true
  return Boolean(row.comp_promo_code_id)
}

export function isAdminMember(row: Pick<MemberPeriodRow, 'role'>): boolean {
  return (row.role ?? '').toLowerCase() === 'admin'
}

/** True only when a parseable period end is strictly before `now`. */
export function periodHasEnded(
  tierExpiresAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!tierExpiresAt) return false
  const ends = new Date(tierExpiresAt).getTime()
  if (Number.isNaN(ends)) return false
  return ends < now.getTime()
}

/**
 * The tier a member is entitled to right now.
 *
 * Two-argument calls keep the historical rule: expired / canceled / cancelled /
 * unpaid collapse to community, and anything else (including past_due) keeps
 * the stored tier. Pass `access` when the caller has the period end, role, and
 * comp flag:
 *   - comp or admin keeps the stored tier
 *   - cancelled / canceled keeps the stored tier while the period is still open
 *   - a paid tier whose period has ended collapses to community
 *     (past_due does not — Stripe is still retrying)
 */
export function effectiveTier(
  tier: string | null | undefined,
  tierStatus: string | null | undefined,
  access?: MemberAccessContext,
): string | null {
  const row: MemberPeriodRow = {
    tier,
    tier_status: tierStatus,
    tier_expires_at: access?.tierExpiresAt,
    role: access?.role,
    comp_promo_code_id: access?.compPromoCodeId,
  }
  if (isCompMember(row) || isAdminMember(row)) return tier ?? null

  const now = access?.now ?? new Date()
  const status = (tierStatus ?? '').toLowerCase()
  const ended = periodHasEnded(row.tier_expires_at, now)
  const stillOpen = Boolean(row.tier_expires_at) && !ended

  if ((status === 'cancelled' || status === 'canceled') && stillOpen) {
    return tier ?? null
  }

  if (status && DEAD_SUBSCRIPTION_STATUSES.has(status)) return 'community'
  if (status === 'past_due') return tier ?? null
  if (ended && isPaidTier(tier)) return 'community'
  return tier ?? null
}

/**
 * Stored-tier downgrade. Same predicate as
 * public.downgrade_expired_paid_members() in migration 099.
 */
export function shouldDowngradeExpiredPaidMember(
  row: MemberPeriodRow,
  now: Date = new Date(),
): boolean {
  if (!isPaidTier(row.tier)) return false
  if (isAdminMember(row) || isCompMember(row)) return false
  if (!periodHasEnded(row.tier_expires_at, now)) return false
  return DOWNGRADE_STATUSES.has((row.tier_status ?? '').toLowerCase())
}

/** Status written by the downgrade. Cancellations stay cancelled. */
export function downgradedTierStatus(status: string | null | undefined): string {
  const s = (status ?? '').toLowerCase()
  if (s === 'cancelled' || s === 'canceled') return 'cancelled'
  return 'expired'
}

/**
 * The single tier_change_log row the 097 trigger writes for this downgrade.
 * Null when the member is not downgraded. A second call after the downgrade
 * returns null (the update is idempotent).
 */
export function plannedDowngradeAudit(
  row: MemberPeriodRow,
  now: Date = new Date(),
): PlannedTierAudit | null {
  if (!shouldDowngradeExpiredPaidMember(row, now)) return null
  const newStatus = downgradedTierStatus(row.tier_status)
  const statusChanged = (row.tier_status ?? null) !== newStatus
  return {
    old_tier: row.tier ?? null,
    new_tier: 'community',
    old_tier_status: row.tier_status ?? null,
    new_tier_status: newStatus,
    direction: statusChanged ? 'tier,tier_status' : 'tier',
  }
}

/**
 * In-memory access gate. Does not write to the database.
 *
 * A cancellation still inside the paid period is shown as active so later
 * checks that only see tier + tier_status keep the access already paid for.
 * A lapsed paid member is shown as community. Comps and admins are not mutated.
 */
export function applyMemberAccess<T extends MemberPeriodRow>(row: T, now: Date = new Date()): T {
  if (isCompMember(row) || isAdminMember(row)) return row

  const original: MemberPeriodRow = {
    tier: row.tier,
    tier_status: row.tier_status,
    tier_expires_at: row.tier_expires_at,
    role: row.role,
    comp_promo_code_id: row.comp_promo_code_id,
  }
  const status = (original.tier_status ?? '').toLowerCase()
  const ended = periodHasEnded(original.tier_expires_at, now)

  if ((status === 'cancelled' || status === 'canceled') && original.tier_expires_at && !ended) {
    row.tier_status = 'active'
    return row
  }

  row.tier = effectiveTier(original.tier, original.tier_status, {
    tierExpiresAt: original.tier_expires_at,
    role: original.role,
    compPromoCodeId: original.comp_promo_code_id,
    now,
  })

  if (shouldDowngradeExpiredPaidMember(original, now)) {
    row.tier = 'community'
    row.tier_status = downgradedTierStatus(original.tier_status)
  }

  return row
}
