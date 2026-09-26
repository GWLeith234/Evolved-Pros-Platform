import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { FitMove } from './moves'
import { PUBLIC_FIT_MOVE_COLUMNS, resolvePublishedFitMoves, type FitMoveRow } from './rows'

/**
 * Published Fit guides for /fit.
 * Selects catalog columns only. Playback ids stay on the service role.
 * Falls back to the fixture list when the table is empty or the query fails
 * (including before 092 is applied).
 */
export async function loadPublishedFitMoves(): Promise<FitMove[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('fit_moves')
      .select(PUBLIC_FIT_MOVE_COLUMNS)
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false })
    if (error) {
      return resolvePublishedFitMoves({ rows: null, error: error.message })
    }
    return resolvePublishedFitMoves({
      rows: (data ?? []) as unknown as FitMoveRow[],
      error: null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fit moves query failed'
    return resolvePublishedFitMoves({ rows: null, error: message })
  }
}
