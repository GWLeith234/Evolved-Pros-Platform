import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { parseThanksCadenceStep } from './constants'
import { planThanksNudgeSweep, queueKey, type NudgeInviteRow } from './nudge'

/** Queue due E02-E12 (and late E01) as pending_approval. Never sends. */
export async function enqueueDueThanksNudges(now: Date = new Date()) {
  const { data: invites } = await (adminClient as any)
    .from('community_thanks_invites')
    .select('id, status, cadence_step, created_at, expires_at, next_send_at, redeemed_at')
    .in('status', ['pending', 'sent'])

  const { data: existing } = await (adminClient as any)
    .from('community_thanks_nudge_queue')
    .select('invite_id, cadence_step')
    .in('status', ['pending_approval', 'approved', 'sent'])

  const existingKeys = new Set<string>()
  for (const row of existing ?? []) {
    const step = parseThanksCadenceStep(row.cadence_step)
    if (step != null) existingKeys.add(queueKey(row.invite_id, step))
  }

  const plan = planThanksNudgeSweep((invites ?? []) as NudgeInviteRow[], existingKeys, now)
  const nowIso = now.toISOString()

  if (plan.expireIds.length > 0) {
    await (adminClient as any)
      .from('community_thanks_invites')
      .update({ status: 'expired', next_send_at: null, stopped_reason: 'expired', updated_at: nowIso })
      .in('id', plan.expireIds)
    await (adminClient as any)
      .from('community_thanks_nudge_queue')
      .update({ status: 'cancelled' })
      .in('invite_id', plan.expireIds)
      .eq('status', 'pending_approval')
  }

  if (plan.enqueue.length > 0) {
    await (adminClient as any)
      .from('community_thanks_nudge_queue')
      .upsert(plan.enqueue, { onConflict: 'invite_id,cadence_step' })
  }

  return {
    queued: plan.enqueue.length,
    expired: plan.expireIds.length,
    sent: 0,
  }
}
