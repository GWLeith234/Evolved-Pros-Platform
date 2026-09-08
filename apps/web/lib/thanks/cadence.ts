import {
  THANKS_CADENCE_OFFSET_DAYS,
  THANKS_CADENCE_STEPS,
  THANKS_EXPIRY_DAYS,
  THANKS_TERMINAL_STEP,
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
  return step === THANKS_TERMINAL_STEP
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
  if (input.lastSentStep === THANKS_TERMINAL_STEP) return { stop: true, reason: 'cadence_complete' }
  return { stop: false }
}

/**
 * Which cadence step is due now, if any (0-11 / E01-E12).
 * Does not send. Caller queues pending_approval.
 *
 * lastSentStep 0 is a real sent E01. Do not treat 0 as missing.
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
  const lastIdx = input.lastSentStep == null ? -1 : THANKS_CADENCE_STEPS.indexOf(input.lastSentStep)
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
