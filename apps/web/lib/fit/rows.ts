/**
 * Map public fit_moves rows onto the fixture shape.
 *
 * mux_playback_id and mux_asset_id are not columns this module reads.
 * A ready video is only a status flag. The playback id stays on the server.
 */

import {
  publishedFitMoves,
  type FitMove,
  type FitMoveLocation,
  type FitMoveStatus,
  type FitVideoStatus,
} from './moves'

export const PUBLIC_FIT_MOVE_COLUMNS = [
  'id',
  'code',
  'slug',
  'title',
  'focus',
  'location',
  'status',
  'featured',
  'hip_mod',
  'hip_mod_note',
  'reps',
  'duration_minutes',
  'duration_label',
  'required_tier',
  'published_at',
  'sort_order',
  'description',
  'video_status',
].join(', ')

const LOCATIONS = new Set<FitMoveLocation>(['Hotel', 'Studio'])
const STATUSES = new Set<FitMoveStatus>(['published', 'pilot', 'draft'])
const VIDEO_STATUSES = new Set<FitVideoStatus>(['draft', 'processing', 'ready', 'errored'])

export type FitMoveRow = {
  id: string
  code: string
  slug: string
  title: string
  focus: string
  location: string
  status: string
  featured: boolean
  hip_mod: boolean
  hip_mod_note: string | null
  reps: string
  duration_minutes: number
  duration_label: string
  required_tier: string
  published_at: string | null
  description: string | null
  video_status: string | null
}

export function fitMoveFromRow(row: FitMoveRow): FitMove | null {
  if (!STATUSES.has(row.status as FitMoveStatus)) return null
  if (!LOCATIONS.has(row.location as FitMoveLocation)) return null
  if (!row.id || !row.code || !row.slug || !row.title) return null
  const videoStatus = VIDEO_STATUSES.has(row.video_status as FitVideoStatus)
    ? (row.video_status as FitVideoStatus)
    : 'draft'
  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    title: row.title,
    focus: row.focus,
    location: row.location as FitMoveLocation,
    status: row.status as FitMoveStatus,
    featured: Boolean(row.featured),
    hipMod: Boolean(row.hip_mod),
    hipModNote: row.hip_mod_note,
    reps: row.reps,
    durationLabel: row.duration_label,
    durationMinutes: row.duration_minutes,
    publishedAt: row.published_at,
    requiredTier: row.required_tier === 'pro' ? 'pro' : 'vip',
    description: row.description,
    videoStatus,
  }
}

/**
 * Published rows from the table win. An empty list or a query error
 * returns the fixture catalog. Draft and pilot rows never render.
 */
export function resolvePublishedFitMoves(result: {
  rows: FitMoveRow[] | null
  error: string | null
}): FitMove[] {
  if (result.error || !result.rows || result.rows.length === 0) {
    return publishedFitMoves()
  }
  const published: FitMove[] = []
  for (const row of result.rows) {
    if (row.status !== 'published') continue
    const move = fitMoveFromRow(row)
    if (move?.status === 'published') published.push(move)
  }
  return published.length > 0 ? published : publishedFitMoves()
}
