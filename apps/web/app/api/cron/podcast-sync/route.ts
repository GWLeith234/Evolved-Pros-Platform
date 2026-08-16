import { NextResponse } from 'next/server'
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
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
