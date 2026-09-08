import { THANKS_CADENCE_STEPS, parseThanksCadenceStep, type ThanksCadenceStep, type ThanksInviteStatus } from './constants'
import { dueCadenceStep, shouldStopCadence } from './cadence'

export type NudgeInviteRow = {
  id: string
  status: ThanksInviteStatus | string
  cadence_step: ThanksCadenceStep
  created_at: string
  expires_at: string
  next_send_at: string | null
  redeemed_at: string | null
}

export type NudgeQueueInsert = {
  invite_id: string
  cadence_step: ThanksCadenceStep
  due_at: string
  status: 'pending_approval'
}

export type NudgeSweepResult = {
  enqueue: NudgeQueueInsert[]
  expireIds: string[]
  stopRedeemedIds: string[]
}

/**
 * Sweep due cadence steps into pending_approval only.
 * Never marks a send. Never invents recipients.
 */
export function planThanksNudgeSweep(
  invites: NudgeInviteRow[],
  existingQueueKeys: Set<string>,
  now: Date,
): NudgeSweepResult {
  const enqueue: NudgeQueueInsert[] = []
  const expireIds: string[] = []
  const stopRedeemedIds: string[] = []

  for (const invite of invites) {
    const createdAt = new Date(invite.created_at)
    const expiresAt = new Date(invite.expires_at)
    const redeemed = Boolean(invite.redeemed_at) || invite.status === 'redeemed'
    const parsedStep = parseThanksCadenceStep(invite.cadence_step)
    const lastSent = invite.status === 'pending' ? null : parsedStep

    const stop = shouldStopCadence({
      redeemed,
      lastSentStep: lastSent,
      now,
      expiresAt,
    })

    if (stop.stop && stop.reason === 'expired' && invite.status !== 'expired' && invite.status !== 'redeemed' && invite.status !== 'stopped') {
      expireIds.push(invite.id)
      continue
    }
    if (stop.stop && stop.reason === 'redeemed' && invite.status !== 'redeemed') {
      stopRedeemedIds.push(invite.id)
      continue
    }
    if (stop.stop) continue

    const due = dueCadenceStep({
      createdAt,
      lastSentStep: lastSent,
      now,
      redeemed,
      expiresAt,
      status: invite.status,
    })
    if (!due) continue
    const key = `${invite.id}:${due}`
    if (existingQueueKeys.has(key)) continue
    enqueue.push({
      invite_id: invite.id,
      cadence_step: due,
      due_at: now.toISOString(),
      status: 'pending_approval',
    })
  }

  return { enqueue, expireIds, stopRedeemedIds }
}

export function queueKey(inviteId: string, step: ThanksCadenceStep): string {
  return `${inviteId}:${step}`
}

export function isSendableQueueStatus(status: string): boolean {
  return status === 'pending_approval' || status === 'approved'
}

export function cadenceSteps(): readonly ThanksCadenceStep[] {
  return THANKS_CADENCE_STEPS
}
