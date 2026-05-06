import { adminClient } from '@/lib/supabase/admin'

/**
 * Capture a weekly progress snapshot for every active, future-dated goal.
 * Idempotent: re-running on the same week is a no-op via the unique
 * (goal_id, snapshot_date) constraint on goal_snapshots.
 */
export async function captureWeeklySnapshots(): Promise<{
  snapshotsWritten: number
}> {
  const today = new Date().toISOString().slice(0, 10)

  const { data: goals, error: goalsErr } = await adminClient
    .from('quarterly_goals')
    .select('id, progress_pct, target_date')
    .gte('target_date', today)

  if (goalsErr) throw goalsErr
  if (!goals || goals.length === 0) return { snapshotsWritten: 0 }

  // ISO week start (Monday) — matches Postgres date_trunc('week', now()).
  const now = new Date()
  const day = now.getUTCDay()
  const offsetToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setUTCDate(now.getUTCDate() + offsetToMonday)
  const snapshotDate = monday.toISOString().slice(0, 10)

  const rows = goals.map(g => ({
    goal_id: g.id,
    snapshot_date: snapshotDate,
    progress_pct: g.progress_pct ?? 0,
  }))

  const { data: inserted, error: insertErr } = await adminClient
    .from('goal_snapshots')
    .upsert(rows, { onConflict: 'goal_id,snapshot_date', ignoreDuplicates: true })
    .select('id')

  if (insertErr) throw insertErr

  return { snapshotsWritten: inserted?.length ?? 0 }
}
