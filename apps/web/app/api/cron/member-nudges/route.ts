export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { authorizeCronBearer } from '@/lib/cron/authorize'
import {
  enqueueDailyProgressNudges,
  enqueueWigNudges,
} from '@/lib/notifications/nudges'

/**
 * Wires the existing notifications table for WIG + daily leading measures.
 *
 * Auth: Bearer CRON_SECRET OR header x-cron-secret: CRON_SECRET.
 * Same dual form as /api/cron/goal-snapshots. Timing-safe, fail closed.
 *
 * Safe to run hourly. Each helper dedupes on (user, type, action_url)
 * so a re-fire does not stack bells. Daily nudges no-op before 17:00 UTC
 * (WelcomeBanner evening).
 *
 * Scheduler: Railway web cronSchedule is unset. GitHub Actions
 * `.github/workflows/cron.yml` hits this route at 17:00 UTC.
 */
export async function GET(request: Request) {
  const gate = authorizeCronBearer(
    request.headers.get('authorization'),
    process.env.CRON_SECRET,
    request.headers.get('x-cron-secret'),
  )
  if (!gate.ok) {
    if (gate.status === 500) console.error('[cron/member-nudges] CRON_SECRET is not set')
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  try {
    const [wig, daily] = await Promise.all([
      enqueueWigNudges(),
      enqueueDailyProgressNudges(),
    ])
    return NextResponse.json({ ok: true, wig, daily })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nudge run failed'
    console.error('[cron/member-nudges] error:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
