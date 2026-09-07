/**
 * Thank-you free Community invite cadence.
 *
 * NEW lane. Promo is THANKS_COMMUNITY. FOG (FRIENDSOFGEORGE / /welcome /
 * friend_invites) is a different product and must stay untouched.
 *
 * Cadence: 12 emails / ~56 days. cadence_step 0-11.
 * Days: D0, D3, D6, D9, D12, D16, D20, D24, D28, D35, D42, D56.
 * Stop on redeem OR after E12 (step 11). Expiry is 90 days from create.
 */

export const THANKS_PROMO_CODE = 'THANKS_COMMUNITY' as const
export const THANKS_PROMO_LABEL = 'Thank you Community' as const
export const THANKS_GRANTS_TIER = 'community' as const
export const THANKS_TIER_STATUS = 'active' as const

export const THANKS_CLAIM_PATH = '/invite/thanks' as const
export const THANKS_WWW_ORIGIN = 'https://www.evolvedpros.com' as const

export const THANKS_EXPIRY_DAYS = 90

export const THANKS_CADENCE_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
export type ThanksCadenceStep = (typeof THANKS_CADENCE_STEPS)[number]

export const THANKS_E01_STEP = 0 as const
export const THANKS_TERMINAL_STEP = 11 as const

export const THANKS_CADENCE_OFFSET_DAYS: Record<ThanksCadenceStep, number> = {
  0: 0,
  1: 3,
  2: 6,
  3: 9,
  4: 12,
  5: 16,
  6: 20,
  7: 24,
  8: 28,
  9: 35,
  10: 42,
  11: 56,
}

export const THANKS_TEMPLATE_PREFIX = 'ep-community-thanks' as const

export function thanksEmailCode(step: ThanksCadenceStep): `e${string}` {
  return `e${String(step + 1).padStart(2, '0')}` as `e${string}`
}

export function thanksTemplateId(step: ThanksCadenceStep): string {
  return `${THANKS_TEMPLATE_PREFIX}-${thanksEmailCode(step)}`
}

export const THANKS_TEMPLATE_IDS = {
  0: 'ep-community-thanks-e01',
  1: 'ep-community-thanks-e02',
  2: 'ep-community-thanks-e03',
  3: 'ep-community-thanks-e04',
  4: 'ep-community-thanks-e05',
  5: 'ep-community-thanks-e06',
  6: 'ep-community-thanks-e07',
  7: 'ep-community-thanks-e08',
  8: 'ep-community-thanks-e09',
  9: 'ep-community-thanks-e10',
  10: 'ep-community-thanks-e11',
  11: 'ep-community-thanks-e12',
} as const satisfies Record<ThanksCadenceStep, string>

export function thanksCadenceLabel(step: ThanksCadenceStep): string {
  return `E${String(step + 1).padStart(2, '0')} D${THANKS_CADENCE_OFFSET_DAYS[step]}`
}

export function parseThanksCadenceStep(value: unknown): ThanksCadenceStep | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return (THANKS_CADENCE_STEPS as readonly number[]).includes(value)
      ? (value as ThanksCadenceStep)
      : null
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return parseThanksCadenceStep(Number.parseInt(value, 10))
  }
  return null
}

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
