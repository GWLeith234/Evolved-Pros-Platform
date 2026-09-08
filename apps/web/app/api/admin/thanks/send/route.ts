export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { explicitYes, isTerminalCadence, nextSendAtAfter } from '@/lib/thanks/cadence'
import { THANKS_E01_STEP, THANKS_GEORGE_SIGNOFF, parseThanksCadenceStep, type ThanksCadenceStep } from '@/lib/thanks/constants'
import { thanksFirstName } from '@/lib/thanks/copy'
import { sendCommunityThanksEmail } from '@/lib/resend/emails/community-thanks'
import { thanksClaimUrl } from '@/lib/thanks/urls'

type Target = {
  inviteId: string
  email: string
  firstName: string | null
  token: string
  step: ThanksCadenceStep
  createdAt: string
  queueId?: string
  status: string
  deliveredCount: number
}

// POST /api/admin/thanks/send
// Body: { confirm: true|'YES', inviteIds?: string[], queueIds?: string[] }
// ASK-ALWAYS. Never fires without explicit YES. Copy-link remains the fallback.
export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  const supabase = createClient()
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser()

  let body: { confirm?: unknown; inviteIds?: unknown; queueIds?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!explicitYes(body.confirm)) {
    return NextResponse.json(
      { error: 'Explicit YES is required. Nothing was sent.' },
      { status: 422 },
    )
  }

  const inviteIds = Array.isArray(body.inviteIds) ? body.inviteIds.map(String).filter(Boolean) : []
  const queueIds = Array.isArray(body.queueIds) ? body.queueIds.map(String).filter(Boolean) : []
  if (inviteIds.length === 0 && queueIds.length === 0) {
    return NextResponse.json({ error: 'Pick at least one invite or queued nudge.' }, { status: 422 })
  }

  const targets: Target[] = []

  if (queueIds.length > 0) {
    const { data: queued } = await (adminClient as any)
      .from('community_thanks_nudge_queue')
      .select('id, invite_id, cadence_step, status, community_thanks_invites ( email, first_name, token, created_at, status, delivered_count )')
      .in('id', queueIds)
    for (const row of queued ?? []) {
      const invite = row.community_thanks_invites as {
        email: string
        first_name: string | null
        token: string
        created_at: string
        status: string
        delivered_count: number | null
      } | null
      const step = parseThanksCadenceStep(row.cadence_step)
      if (!invite || !step) continue
      if (invite.status === 'redeemed' || invite.status === 'stopped' || invite.status === 'expired') continue
      if (row.status !== 'pending_approval' && row.status !== 'approved') continue
      targets.push({
        inviteId: row.invite_id,
        email: invite.email,
        firstName: invite.first_name,
        token: invite.token,
        step,
        createdAt: invite.created_at,
        queueId: row.id,
        status: invite.status,
        deliveredCount: invite.delivered_count ?? 0,
      })
    }
  }

  if (inviteIds.length > 0) {
    const { data: invites } = await (adminClient as any)
      .from('community_thanks_invites')
      .select('id, email, first_name, token, cadence_step, created_at, status, delivered_count')
      .in('id', inviteIds)
    for (const row of invites ?? []) {
      if (row.status === 'redeemed' || row.status === 'stopped' || row.status === 'expired') continue
      const step: ThanksCadenceStep = row.status === 'pending' ? THANKS_E01_STEP : (parseThanksCadenceStep(row.cadence_step) ?? THANKS_E01_STEP)
      targets.push({
        inviteId: row.id,
        email: row.email,
        firstName: row.first_name,
        token: row.token,
        step,
        createdAt: row.created_at,
        status: row.status,
        deliveredCount: row.delivered_count ?? 0,
      })
    }
  }

  const results: Array<{ email: string; delivered: boolean; step: ThanksCadenceStep; claimUrl: string }> = []
  const now = new Date()
  const nowIso = now.toISOString()

  for (const target of targets) {
    const claimUrl = thanksClaimUrl(target.token)
    const send = await sendCommunityThanksEmail(target.email, target.step, {
      first_name: thanksFirstName(target.firstName),
      claim_url: claimUrl,
      george_signoff: THANKS_GEORGE_SIGNOFF,
    })

    const createdAt = new Date(target.createdAt)
    const next = nextSendAtAfter(createdAt, target.step)
    const done = isTerminalCadence(target.step)

    const patch: Record<string, unknown> = {
      status: done ? 'stopped' : 'sent',
      cadence_step: target.step,
      last_sent_at: nowIso,
      next_send_at: next ? next.toISOString() : null,
      last_resend_id: send.resendId ?? null,
      delivered_count: send.delivered ? target.deliveredCount + 1 : target.deliveredCount,
      updated_at: nowIso,
    }
    if (done) patch.stopped_reason = 'cadence_complete'
    if (target.status === 'pending') patch.sent_at = nowIso

    await (adminClient as any)
      .from('community_thanks_invites')
      .update(patch)
      .eq('id', target.inviteId)

    await (adminClient as any).from('community_thanks_sends').insert({
      invite_id: target.inviteId,
      cadence_step: target.step,
      resend_id: send.resendId ?? null,
      status: send.delivered ? 'sent' : 'failed',
    })

    if (target.queueId) {
      await (adminClient as any)
        .from('community_thanks_nudge_queue')
        .update({
          status: send.delivered ? 'sent' : 'approved',
          approved_at: nowIso,
          approved_by: adminUser?.id ?? null,
        })
        .eq('id', target.queueId)
    }

    results.push({ email: target.email, delivered: send.delivered, step: target.step, claimUrl })
  }

  return NextResponse.json({
    ok: true,
    attempted: results.length,
    delivered: results.filter(r => r.delivered).length,
    rows: results,
  })
}
