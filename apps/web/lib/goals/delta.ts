import 'server-only'
import { adminClient } from '@/lib/supabase/admin'

export interface GoalDelta {
  current: number
  weekAgo: number | null
  delta: number | null
}

/**
 * Reads the two most recent snapshots for `goalId` and returns
 * { current, weekAgo, delta }. delta is null when fewer than two
 * snapshots exist; the caller should fall back to the legacy
 * `weekly_delta` column on the goal row in that case.
 *
 * Goes through the service-role client so the lookup works for
 * any caller (cron / SSR resolver / API route). RLS gating happens
 * upstream where the goal itself is fetched.
 */
export async function getGoalDelta(goalId: string): Promise<GoalDelta> {
  const { data, error } = await adminClient
    .from('goal_snapshots')
    .select('progress_pct, snapshot_date')
    .eq('goal_id', goalId)
    .order('snapshot_date', { ascending: false })
    .limit(2)

  if (error) {
    console.error('[goals/delta] select failed:', error.message)
    return { current: 0, weekAgo: null, delta: null }
  }

  const rows = (data ?? []) as Array<{ progress_pct: number; snapshot_date: string }>
  if (rows.length === 0) return { current: 0, weekAgo: null, delta: null }

  const current = Number(rows[0].progress_pct) || 0
  if (rows.length < 2) return { current, weekAgo: null, delta: null }

  const weekAgo = Number(rows[1].progress_pct) || 0
  return { current, weekAgo, delta: current - weekAgo }
}
