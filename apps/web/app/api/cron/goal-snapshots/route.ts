/**
 * Weekly cron — capture goal_snapshots for active, future-dated goals.
 *
 * Schedule (Railway): "0 0 * * 1" — Mondays 00:00 UTC.
 * Idempotent: a same-week re-hit returns snapshotsWritten:0.
 */

export const dynamic = 'force-dynamic'

import { captureWeeklySnapshots } from '@/lib/goals/snapshot'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[Cron] CRON_SECRET is not set')
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  if (request.headers.get('x-cron-secret') !== secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { snapshotsWritten } = await captureWeeklySnapshots()
    return Response.json({ ok: true, snapshotsWritten })
  } catch (err) {
    console.error('[Cron] goal-snapshots failed', err)
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
