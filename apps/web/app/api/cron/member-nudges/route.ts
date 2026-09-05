export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import {
  enqueueDailyProgressNudges,
  enqueueWigNudges,
} from '@/lib/notifications/nudges'

/**
 * Wires the existing notifications table for WIG + daily leading measures.
 *
 * Auth: Bearer ${CRON_SECRET} OR header x-cron-secret: ${CRON_SECRET}
 * — same dual form as /api/cron/goal-snapshots.
 *
 * Safe to run hourly. Each helper dedupes on (user, type, action_url)
 * so a re-fire does not stack bells. Daily nudges no-op before 17:00 UTC
 * (WelcomeBanner evening).
 *
 * Scheduler: Railway web cronSchedule is unset. GitHub Actions
 * `.github/workflows/cron.yml` hits this route at 17:00 UTC.
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
