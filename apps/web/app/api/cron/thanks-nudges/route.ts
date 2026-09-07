export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { enqueueDueThanksNudges } from '@/lib/thanks/enqueue'

/**
 * Enqueue due thank-you Community cadence steps into pending_approval.
 * NEVER calls Resend. Redeemed and post-E12 invites are skipped / stopped.
 *
 * Auth: Bearer ${CRON_SECRET} OR header x-cron-secret: ${CRON_SECRET}
 */
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const auth = request.headers.get('authorization') ?? ''
  const xSecret = request.headers.get('x-cron-secret') ?? ''
  const ok = auth === `Bearer ${expected}` || xSecret === expected
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sweep = await enqueueDueThanksNudges()
    return NextResponse.json({ ok: true, ...sweep, sent: 0, autoSend: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Thanks nudge sweep failed'
    console.error('[cron/thanks-nudges] error:', message)
    return NextResponse.json({ ok: false, error: message, sent: 0 }, { status: 500 })
  }
}
