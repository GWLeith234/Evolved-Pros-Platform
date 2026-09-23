import { NextResponse } from 'next/server'
import { authorizeCronBearer } from '@/lib/cron/authorize'
import { syncPodcastFromRss } from '@/lib/podcast/syncFromRss'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * External scheduler (cron-job.org) hits this GET with
 * `Authorization: Bearer ${CRON_SECRET}`.
 *
 * The sync runs in-process. Do not POST out to /api/admin/podcast/sync —
 * that hop used Node's default UA, originated from the Railway web IP, and
 * 401'd in middleware (no session) before the route could read x-cron-secret.
 */
export async function GET(request: Request) {
  const gate = authorizeCronBearer(request.headers.get('authorization'), process.env.CRON_SECRET)
  if (!gate.ok) {
    if (gate.status === 500) console.error('[cron/podcast-sync] CRON_SECRET is not set')
    return NextResponse.json({ error: gate.error }, { status: gate.status })
  }

  const result = await syncPodcastFromRss()
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json({
    inserted: result.inserted,
    skipped: result.skipped,
    malformed: result.malformed,
    episodes: result.episodes,
  })
}
