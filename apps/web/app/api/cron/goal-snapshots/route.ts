export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { captureWeeklySnapshots } from '@/lib/goals/snapshot'
import { enqueueWeeklyWigNudges } from '@/lib/notifications/nudges'

/**
 * Weekly cron: writes a goal_snapshots row per active goal at the
 * current ISO-Monday date. Idempotent under (goal_id, snapshot_date).
 *
 * Auth: Bearer ${CRON_SECRET} OR header x-cron-secret: ${CRON_SECRET}
 * — first form matches /api/cron/podcast-sync, second form matches
 * the publish-posts cron. Either is accepted so Railway's existing
 * scheduler conventions don't need to change.
 *
 * Scheduler: Railway web cronSchedule is unset. GitHub Actions
 * `.github/workflows/cron.yml` hits this route Monday 08:15 UTC.
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
