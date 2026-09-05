/**
 * POST /api/auth/provision — join / signup CRM hook.
 *
 * Called after password signUp or a magic-link send in signup mode. The
 * client cannot write crm_prospects (RLS). PUBLIC: rate-limited, honeypot,
 * email-only. Upserts tag `join` and fans out the admin NotifBell.
 *
 * PII: error paths log codes only.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseIntakeDb } from '@/lib/crm/intakeDb'
import { notifyJoinAdmins, upsertJoinProspect, validateJoinEmail } from '@/lib/crm/join'
import { clientIpFrom, createRateLimiter } from '@/lib/speaking/inquiry'

const limiter = createRateLimiter(5, 10 * 60 * 1000)

export async function POST(request: Request) {
  let body: { email?: unknown; website?: unknown }
  try {
    body = (await request.json()) as { email?: unknown; website?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const result = validateJoinEmail(body)
  if (result.kind === 'bot') {
    return NextResponse.json({ ok: true })
  }
  if (result.kind === 'invalid') {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }

  if (!limiter.check(clientIpFrom(request.headers))) {
    return NextResponse.json(
      { error: 'Too many submissions from this connection. Please try again shortly.' },
      { status: 429 },
    )
  }

  const email = result.email
  const outcome = await upsertJoinProspect(supabaseIntakeDb, { email })
  if (outcome.kind === 'error') {
    console.error('[POST /api/auth/provision] prospect write failed', outcome.code ?? 'unknown')
    return NextResponse.json(
      { error: 'Something went wrong on our end. Please try again shortly.' },
      { status: 500 },
    )
  }

  const notified = await notifyJoinAdmins(supabaseIntakeDb, { email })
  if (notified.code) {
    console.error('[POST /api/auth/provision] admin notify failed', notified.code)
  }

  return NextResponse.json({ ok: true })
}
