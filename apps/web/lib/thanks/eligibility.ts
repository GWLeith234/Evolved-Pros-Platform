import { FOG_BLOCKING_STATUSES } from './constants'

export type FogInviteSnapshot = {
  email: string
  status: string
}

export type MemberSnapshot = {
  email: string
  tier: string | null
  tier_status: string | null
  stripe_subscription_id?: string | null
  stripe_customer_id?: string | null
  role?: string | null
}

export type PreviewDisposition =
  | 'invite'
  | 'invalid'
  | 'already_paid'
  | 'already_member'
  | 'fog_excluded'
  | 'duplicate'

export const PAID_TIERS = new Set(['vip', 'pro', 'professional'])
export const PAID_STATUSES = new Set(['active', 'trial', 'trialing', 'past_due'])

export function normalizeThanksEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidThanksEmail(value: unknown): boolean {
  const email = normalizeThanksEmail(value)
  return EMAIL_RE.test(email)
}

export function isAlreadyPaid(member: MemberSnapshot | null | undefined): boolean {
  if (!member) return false
  if (member.stripe_subscription_id) return true
  const tier = (member.tier ?? '').toLowerCase()
  const status = (member.tier_status ?? '').toLowerCase()
  // Paid = Stripe-backed. Comp / FOG Pro without a subscription is not paid.
  if (member.stripe_customer_id && PAID_TIERS.has(tier) && PAID_STATUSES.has(status)) {
    return true
  }
  return false
}

export function isAlreadyMember(member: MemberSnapshot | null | undefined): boolean {
  if (!member) return false
  return true
}

export function isFogBlocked(
  fog: FogInviteSnapshot | null | undefined,
  opts: { override: boolean; reason: string },
): boolean {
  if (!fog) return false
  const blocking = (FOG_BLOCKING_STATUSES as readonly string[]).includes(fog.status)
  if (!blocking) return false
  if (opts.override && opts.reason.trim().length > 0) return false
  return true
}

export function classifyRecipient(input: {
  email: string
  member?: MemberSnapshot | null
  fog?: FogInviteSnapshot | null
  fogOverride?: boolean
  fogOverrideReason?: string
}): PreviewDisposition {
  if (!isValidThanksEmail(input.email)) return 'invalid'
  if (isAlreadyPaid(input.member)) return 'already_paid'
  if (isAlreadyMember(input.member)) return 'already_member'
  if (
    isFogBlocked(input.fog, {
      override: Boolean(input.fogOverride),
      reason: input.fogOverrideReason ?? '',
    })
  ) {
    return 'fog_excluded'
  }
  return 'invite'
}

export type GrantDecision =
  | { action: 'grant_community' }
  | { action: 'leave_alone'; reason: 'already_paid' | 'already_member' }

/**
 * Claim-time grant. already_paid / already_member leave the users row alone.
 * New people get community + active. Never VIP/Pro. Never Stripe.
 */
export function decideThanksGrant(member: MemberSnapshot | null | undefined): GrantDecision {
  if (!member) return { action: 'grant_community' }
  if (isAlreadyPaid(member)) return { action: 'leave_alone', reason: 'already_paid' }
  return { action: 'leave_alone', reason: 'already_member' }
}

export function fogOverrideAllowed(override: unknown, reason: unknown): {
  ok: boolean
  override: boolean
  reason: string
} {
  const on = override === true
  const text = typeof reason === 'string' ? reason.trim() : ''
  if (!on) return { ok: true, override: false, reason: '' }
  if (!text) return { ok: false, override: true, reason: '' }
  return { ok: true, override: true, reason: text }
}
