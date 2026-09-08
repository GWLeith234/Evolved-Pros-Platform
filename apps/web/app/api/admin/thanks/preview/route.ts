export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { parseThanksRecipients, previewThanksBatch } from '@/lib/thanks/batch'
import { fogOverrideAllowed } from '@/lib/thanks/eligibility'
import { loadExistingThanksEmails, loadFogByEmail, loadMembersByEmail } from '@/lib/thanks/serverLookups'

// POST /api/admin/thanks/preview — classify a paste/CSV. No writes. No sends.
export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: { raw?: unknown; fogOverride?: unknown; fogOverrideReason?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const raw = typeof body.raw === 'string' ? body.raw : ''
  if (!raw.trim()) {
    return NextResponse.json({ error: 'Paste emails or a CSV first.' }, { status: 422 })
  }

  const override = fogOverrideAllowed(body.fogOverride, body.fogOverrideReason)
  if (!override.ok) {
    return NextResponse.json(
      { error: 'FOG override needs a written reason. Pending and redeemed Friends of George stay excluded.' },
      { status: 422 },
    )
  }

  const parsed = parseThanksRecipients(raw)
  const emails = parsed.rows.map(r => r.email)
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

  return NextResponse.json({
    ok: true,
    rows: preview.rows,
    inviteable: preview.inviteable.length,
    skipped: preview.rows.length - preview.inviteable.length,
  })
}
