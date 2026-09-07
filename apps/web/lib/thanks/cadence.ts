import {
  THANKS_CADENCE_OFFSET_DAYS,
  THANKS_CADENCE_STEPS,
  THANKS_EXPIRY_DAYS,
  type ThanksCadenceStep,
} from './constants'

const DAY_MS = 24 * 60 * 60 * 1000

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * DAY_MS)
}

export function thanksExpiresAt(createdAt: Date): Date {
  return addDays(createdAt, THANKS_EXPIRY_DAYS)
}

export function stepOffsetDays(step: ThanksCadenceStep): number {
  return THANKS_CADENCE_OFFSET_DAYS[step]
}

export function stepDueAt(createdAt: Date, step: ThanksCadenceStep): Date {
  return addDays(createdAt, THANKS_CADENCE_OFFSET_DAYS[step])
}

export function nextStepAfter(step: ThanksCadenceStep): ThanksCadenceStep | null {
  const idx = THANKS_CADENCE_STEPS.indexOf(step)
  if (idx < 0 || idx >= THANKS_CADENCE_STEPS.length - 1) return null
  return THANKS_CADENCE_STEPS[idx + 1]
}

export function nextSendAtAfter(createdAt: Date, sentStep: ThanksCadenceStep): Date | null {
  const next = nextStepAfter(sentStep)
  if (!next) return null
  return stepDueAt(createdAt, next)
}

export function isTerminalCadence(step: ThanksCadenceStep): boolean {
  return step === 'd28'
}

export type CadenceStopReason = 'redeemed' | 'cadence_complete' | 'expired'

export function shouldStopCadence(input: {
  redeemed: boolean
  lastSentStep: ThanksCadenceStep | null
  now: Date
  expiresAt: Date
}): { stop: boolean; reason?: CadenceStopReason } {
  if (input.redeemed) return { stop: true, reason: 'redeemed' }
  if (input.expiresAt.getTime() <= input.now.getTime()) return { stop: true, reason: 'expired' }
  if (input.lastSentStep === 'd28') return { stop: true, reason: 'cadence_complete' }
  return { stop: false }
}

/**
 * Which cadence step is due now, if any. Only D0/D7/D14/D28.
 * Does not send. Caller queues pending_approval.
 */
export function dueCadenceStep(input: {
  createdAt: Date
  lastSentStep: ThanksCadenceStep | null
  now: Date
  redeemed: boolean
  expiresAt: Date
  status: string
}): ThanksCadenceStep | null {
  if (input.redeemed || input.status === 'redeemed' || input.status === 'stopped' || input.status === 'expired') {
    return null
  }
  if (input.expiresAt.getTime() <= input.now.getTime()) return null
  const lastIdx = input.lastSentStep ? THANKS_CADENCE_STEPS.indexOf(input.lastSentStep) : -1
  for (const step of THANKS_CADENCE_STEPS) {
    const idx = THANKS_CADENCE_STEPS.indexOf(step)
    if (idx <= lastIdx) continue
    if (stepDueAt(input.createdAt, step).getTime() <= input.now.getTime()) {
      return step
    }
    return null
  }
  return null
}

export function explicitYes(value: unknown): boolean {
  return value === true || value === 'YES' || value === 'yes'
}
