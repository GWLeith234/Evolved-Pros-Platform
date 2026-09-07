/**
 * Thank-you free Community invite cadence.
 *
 * NEW lane. Promo is THANKS_COMMUNITY. FOG (FRIENDSOFGEORGE / /welcome /
 * friend_invites) is a different product and must stay untouched.
 */

export const THANKS_PROMO_CODE = 'THANKS_COMMUNITY' as const
export const THANKS_PROMO_LABEL = 'Thank you Community' as const
export const THANKS_GRANTS_TIER = 'community' as const
export const THANKS_TIER_STATUS = 'active' as const

export const THANKS_CLAIM_PATH = '/invite/thanks' as const
export const THANKS_WWW_ORIGIN = 'https://www.evolvedpros.com' as const

export const THANKS_EXPIRY_DAYS = 90
export const THANKS_CADENCE_STEPS = ['d0', 'd7', 'd14', 'd28'] as const
export type ThanksCadenceStep = (typeof THANKS_CADENCE_STEPS)[number]

export const THANKS_CADENCE_OFFSET_DAYS: Record<ThanksCadenceStep, number> = {
  d0: 0,
  d7: 7,
  d14: 14,
  d28: 28,
}

export const THANKS_TEMPLATE_PREFIX = 'ep-community-thanks' as const
export const THANKS_TEMPLATE_IDS = {
  d0: 'ep-community-thanks-d0',
  d7: 'ep-community-thanks-d7',
  d14: 'ep-community-thanks-d14',
  d28: 'ep-community-thanks-d28',
} as const satisfies Record<ThanksCadenceStep, string>

export const THANKS_STATUSES = ['pending', 'sent', 'redeemed', 'stopped', 'expired'] as const
export type ThanksInviteStatus = (typeof THANKS_STATUSES)[number]

export const THANKS_NUDGE_STATUSES = ['pending_approval', 'approved', 'sent', 'cancelled'] as const
export type ThanksNudgeStatus = (typeof THANKS_NUDGE_STATUSES)[number]

export const THANKS_GEORGE_SIGNOFF = 'George' as const

export const FOG_PROMO_CODE_LOCK = 'FRIENDSOFGEORGE' as const
export const FOG_CLAIM_PATH_LOCK = '/welcome' as const

/** FOG invite statuses that block a thank-you invite unless override+reason. */
export const FOG_BLOCKING_STATUSES = ['invited', 'redeemed'] as const

export const THANKS_STOP_REASONS = {
  redeemed: 'redeemed',
  cadence_complete: 'cadence_complete',
  already_paid: 'already_paid',
  already_member: 'already_member',
  fog_excluded: 'fog_excluded',
  expired: 'expired',
  admin_stopped: 'admin_stopped',
} as const

export type ThanksStopReason = (typeof THANKS_STOP_REASONS)[keyof typeof THANKS_STOP_REASONS]
