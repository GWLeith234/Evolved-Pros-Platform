export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { authorizeCronBearer } from '@/lib/cron/authorize'
import { enqueueDueThanksNudges } from '@/lib/thanks/enqueue'

/**
 * Enqueue due thank-you Community cadence steps into pending_approval.
 * NEVER calls Resend. Redeemed and post-E12 invites are skipped / stopped.
 *
 * Auth: Bearer CRON_SECRET OR header x-cron-secret: CRON_SECRET.
 * Timing-safe, and closed when the secret is missing.
 */
export async function GET(request: Request) {
  const gate = authorizeCronBearer(
    request.headers.get('authorization'),
    process.env.CRON_SECRET,
    request.headers.get('x-cron-secret'),
  )
  if (!gate.ok) {
    if (gate.status === 500) console.error('[cron/thanks-nudges] CRON_SECRET is not set')
    return NextResponse.json({ error: gate.error }, { status: gate.status })
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
