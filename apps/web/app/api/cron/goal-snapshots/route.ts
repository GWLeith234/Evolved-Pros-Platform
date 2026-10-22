export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { authorizeCronBearer } from '@/lib/cron/authorize'
import { captureWeeklySnapshots } from '@/lib/goals/snapshot'
import { enqueueWeeklyWigNudges } from '@/lib/notifications/nudges'

/**
 * Weekly cron: writes a goal_snapshots row per active goal at the
 * current ISO-Monday date. Idempotent under (goal_id, snapshot_date).
 *
 * Auth: Bearer CRON_SECRET OR header x-cron-secret: CRON_SECRET.
 * Either is accepted so Railway's existing scheduler conventions
 * don't need to change. Comparison is timing-safe and fails closed
 * when the secret is missing.
 *
 * Scheduler: Railway web cronSchedule is unset. GitHub Actions
 * `.github/workflows/cron.yml` hits this route Monday 08:15 UTC.
 */
export async function GET(request: Request) {
  const gate = authorizeCronBearer(
    request.headers.get('authorization'),
    process.env.CRON_SECRET,
    request.headers.get('x-cron-secret'),
  )
  if (!gate.ok) {
    if (gate.status === 500) console.error('[cron/goal-snapshots] CRON_SECRET is not set')
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  try {
    const snapshotsWritten = await captureWeeklySnapshots()
    // Existing snapshot cron is the weekly WIG cadence — reuse it so the
    // bell gets a check-in without a second scheduler.
    const weeklyWigNudges = await enqueueWeeklyWigNudges()
    return NextResponse.json({ ok: true, snapshotsWritten, weeklyWigNudges })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Snapshot run failed'
    console.error('[cron/goal-snapshots] error:', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
