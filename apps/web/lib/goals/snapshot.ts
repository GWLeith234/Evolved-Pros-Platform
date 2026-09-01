import 'server-only'
import { adminClient } from '@/lib/supabase/admin'

/**
 * Walks every still-active goal (target_date >= today) and inserts a
 * snapshot row at the start-of-week date. Idempotent under the
 * (goal_id, snapshot_date) unique key, so a re-fire on the same day
 * adds nothing.
 *
 * Returns the number of NEW rows actually written. Re-running on the
 * same day is expected to return 0.
 */
export async function captureWeeklySnapshots(): Promise<number> {
  // ISO Monday for the current week, in UTC (the cron schedule is UTC
  // too — keeping this server-side and locale-free avoids drift).
  const now = new Date()
  const day = now.getUTCDay()                 /* 0=Sun..6=Sat */
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff))
  const snapshotDate = monday.toISOString().slice(0, 10)
  const todayStr = now.toISOString().slice(0, 10)

  const { data: goals, error: goalsErr } = await adminClient
    .from('quarterly_goals')
    .select('id, progress_pct, target_date')
    .gte('target_date', todayStr)

  if (goalsErr) {
    console.error('[goals/snapshot] select goals failed:', goalsErr.message)
    throw new Error(`select goals failed: ${goalsErr.message}`)
  }

  const rows = (goals ?? []) as Array<{ id: string; progress_pct: number | null }>
  if (rows.length === 0) return 0

  const payload = rows.map(g => ({
    goal_id:       g.id,
    snapshot_date: snapshotDate,
    progress_pct:  g.progress_pct ?? 0,
  }))

  // Use upsert with ignoreDuplicates so the unique constraint stops
  // re-writes silently. The returned data is the actually-inserted
  // set, which is what we count.
  const { data: inserted, error: insertErr } = await adminClient
    .from('goal_snapshots')
    .upsert(payload, { onConflict: 'goal_id,snapshot_date', ignoreDuplicates: true })
    .select('id')

  if (insertErr) {
    console.error('[goals/snapshot] insert snapshots failed:', insertErr.message)
    throw new Error(`insert snapshots failed: ${insertErr.message}`)
  }

  return (inserted ?? []).length
}
