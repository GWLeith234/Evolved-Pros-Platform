export const dynamic = 'force-dynamic'

import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { parseThanksRecipients, previewThanksBatch } from '@/lib/thanks/batch'
import { explicitYes, nextSendAtAfter, thanksExpiresAt } from '@/lib/thanks/cadence'
import { THANKS_E01_STEP, THANKS_GEORGE_SIGNOFF, THANKS_PROMO_CODE } from '@/lib/thanks/constants'
import { fogOverrideAllowed } from '@/lib/thanks/eligibility'
import { loadExistingThanksEmails, loadFogByEmail, loadMembersByEmail } from '@/lib/thanks/serverLookups'
import { thanksClaimUrl } from '@/lib/thanks/urls'
import { sendCommunityThanksEmail } from '@/lib/resend/emails/community-thanks'
import { thanksFirstName } from '@/lib/thanks/copy'

// POST /api/admin/thanks/batch
// Body: { raw, confirm: true|'YES', sendD0?: boolean, fogOverride?, fogOverrideReason? }
// Creates invite rows (E01 / step 0 only). Sends E01 only when confirm + sendD0 are set.
// Queue-without-send is confirm + sendD0 false.
export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  const supabase = createClient()
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser()

  let body: {
    raw?: unknown
    confirm?: unknown
    sendD0?: unknown
    fogOverride?: unknown
    fogOverrideReason?: unknown
  }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  if (!explicitYes(body.confirm)) {
    return NextResponse.json(
      { error: 'Explicit YES is required. Nothing was created or sent.' },
      { status: 422 },
    )
  }

  const raw = typeof body.raw === 'string' ? body.raw : ''
  if (!raw.trim()) {
    return NextResponse.json({ error: 'Paste emails or a CSV first.' }, { status: 422 })
  }

  const override = fogOverrideAllowed(body.fogOverride, body.fogOverrideReason)
  if (!override.ok) {
    return NextResponse.json(
      { error: 'FOG override needs a written reason.' },
      { status: 422 },
    )
  }

  const sendD0 = body.sendD0 === true
  const parsed = parseThanksRecipients(raw)
  const emails = parsed.rows.map(r => r.email)
  if (emails.length > 200) {
    return NextResponse.json({ error: 'Too many emails (max 200 per batch).' }, { status: 422 })
  }

  const [membersByEmail, fogByEmail, existingThanksEmails] = await Promise.all([
    loadMembersByEmail(emails),
    loadFogByEmail(emails),
    loadExistingThanksEmails(emails),
  ])

  const preview = previewThanksBatch({
    raw,
    membersByEmail,
    fogByEmail,
    existingThanksEmails,
    fogOverride: override.override,
    fogOverrideReason: override.reason,
  })

  const { data: code } = await (adminClient as any)
    .from('promo_codes')
    .select('id, code, grants_tier')
    .eq('code', THANKS_PROMO_CODE)
    .maybeSingle()
  if (!code?.id || code.code === 'FRIENDSOFGEORGE' || code.grants_tier !== 'community') {
    return NextResponse.json({ error: 'THANKS_COMMUNITY promo is not configured.' }, { status: 500 })
  }

  const batchId = randomUUID()
  const createdAt = new Date()
  const now = createdAt.toISOString()
  const expiresAt = thanksExpiresAt(createdAt).toISOString()
  const nextSendAt = nextSendAtAfter(createdAt, THANKS_E01_STEP)?.toISOString() ?? null

  const created: Array<{
    id: string
    email: string
    token: string
    status: string
    delivered: boolean
  }> = []

  for (const row of preview.inviteable) {
    const token = randomUUID()
    const { data: inserted, error: insErr } = await (adminClient as any)
      .from('community_thanks_invites')
      .insert({
        email: row.email,
        first_name: row.firstName || null,
        promo_code_id: code.id,
        invited_by: adminUser?.id ?? null,
        token,
        status: 'pending',
        cadence_step: THANKS_E01_STEP,
        expires_at: expiresAt,
        next_send_at: nextSendAt,
        batch_id: batchId,
        fog_override: override.override,
        fog_override_reason: override.reason || null,
        created_at: now,
        updated_at: now,
      })
      .select('id, email, token, status')
      .maybeSingle()

    if (insErr || !inserted) {
      created.push({ id: '', email: row.email, token, status: 'pending', delivered: false })
      continue
    }

    let delivered = false
    if (sendD0) {
      const claimUrl = thanksClaimUrl(inserted.token)
      const send = await sendCommunityThanksEmail(row.email, THANKS_E01_STEP, {
        first_name: thanksFirstName(row.firstName),
        claim_url: claimUrl,
        george_signoff: THANKS_GEORGE_SIGNOFF,
      })
      delivered = send.delivered
      await (adminClient as any)
        .from('community_thanks_invites')
        .update({
          status: 'sent',
          sent_at: now,
          last_sent_at: now,
          cadence_step: THANKS_E01_STEP,
          delivered_count: delivered ? 1 : 0,
          last_resend_id: send.resendId ?? null,
          updated_at: now,
        })
        .eq('id', inserted.id)
      await (adminClient as any).from('community_thanks_sends').insert({
        invite_id: inserted.id,
        cadence_step: THANKS_E01_STEP,
        resend_id: send.resendId ?? null,
        status: delivered ? 'sent' : 'failed',
      })
    } else {
      await (adminClient as any).from('community_thanks_nudge_queue').upsert(
        {
          invite_id: inserted.id,
          cadence_step: THANKS_E01_STEP,
          due_at: now,
          status: 'pending_approval',
        },
        { onConflict: 'invite_id,cadence_step' },
      )
    }

    created.push({
      id: inserted.id,
      email: inserted.email,
      token: inserted.token,
      status: sendD0 ? 'sent' : 'pending',
      delivered,
    })
  }

  return NextResponse.json({
    ok: true,
    batchId,
    created: created.length,
    delivered: created.filter(r => r.delivered).length,
    queued: sendD0 ? 0 : created.length,
    skipped: preview.rows.filter(r => r.disposition !== 'invite'),
    rows: created,
  })
}
