import { adminClient } from '@/lib/supabase/admin'

export type GoalDelta = {
  current: number
  weekAgo: number | null
  delta: number | null
}

/**
 * Returns current vs prior-snapshot progress for a goal. Returns delta:null
 * when fewer than two snapshots exist — caller (HOME-2) falls back to the
 * weekly_delta column on quarterly_goals in that case.
 */
export async function getGoalDelta(goalId: string): Promise<GoalDelta> {
  const { data, error } = await adminClient
    .from('goal_snapshots')
    .select('progress_pct')
    .eq('goal_id', goalId)
    .order('snapshot_date', { ascending: false })
    .limit(2)

  if (error) throw error

  const rows = data ?? []
  const current = Number(rows[0]?.progress_pct ?? 0)

  if (rows.length < 2) {
    return { current, weekAgo: null, delta: null }
  }

  const weekAgo = Number(rows[1].progress_pct)
  return { current, weekAgo, delta: current - weekAgo }
}
