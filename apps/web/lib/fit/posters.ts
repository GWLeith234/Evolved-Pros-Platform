/**
 * Signed Mux posters for locked and logged-out Fit cards.
 *
 * Option (a): image.mux.com thumbnail URL with a thumbnail token only.
 * The playback id is the path segment Mux requires. The token audience
 * is t, so the URL cannot authorize playback.
 *
 * Callers that can play Fit do not get these URLs. They use the gated
 * mux-token route, which is the only place a video token is signed.
 */
import 'server-only'
import { canAccessFitLibrary } from '@/lib/fit/gating'
import { coerceFitThumbnailTime, generateFitMuxThumbnailToken } from '@/lib/mux/client'
import type { FitMove } from './moves'

const SECRET_KEYS = [
  'mux_playback_id',
  'mux_asset_id',
  'token',
  'thumbnailToken',
  'playbackId',
  'playbackToken',
  'videoUrl',
] as const

type PosterRow = {
  id: string
  code?: string | null
  status: string
  video_status: string | null
  mux_playback_id: string | null
  thumbnail_time: number | string | null
}

function jwtPayload(token: string): Record<string, unknown> | null {
  const part = token.split('.')[1]
  if (!part) return null
  try {
    const payload = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as unknown
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}

function jwtAudience(token: string): string | null {
  const aud = jwtPayload(token)?.aud
  return typeof aud === 'string' ? aud : null
}

/** image.mux.com thumbnail with an aud t token. Anything else is dropped. */
export function publicFitPosterUrl(value: string | null | undefined): string | null {
  if (!value) return null
  if (/stream\.mux\.com|\.m3u8|video\.mux\.com/i.test(value)) return null
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.hostname !== 'image.mux.com') return null
  if (!/^\/[^/]+\/thumbnail\.(jpg|jpeg|png|webp)$/.test(url.pathname)) return null
  if (url.searchParams.size !== 1) return null
  const token = url.searchParams.get('token')
  if (!token || jwtAudience(token) !== 't') return null
  return `https://image.mux.com${url.pathname}?token=${encodeURIComponent(token)}`
}

export function fitMuxThumbnailUrl(playbackId: string, token: string): string | null {
  if (!playbackId || jwtAudience(token) !== 't') return null
  return publicFitPosterUrl(
    `https://image.mux.com/${encodeURIComponent(playbackId)}/thumbnail.jpg?token=${encodeURIComponent(token)}`,
  )
}

function withoutPlaybackSecrets(move: FitMove, posterUrl: string | null): FitMove {
  const next: FitMove & Record<string, unknown> = { ...move, posterUrl }
  for (const key of SECRET_KEYS) delete next[key]
  return next
}

async function posterForRow(row: PosterRow | undefined): Promise<string | null> {
  if (!row || row.status !== 'published' || row.video_status !== 'ready' || !row.mux_playback_id) {
    return null
  }
  const token = await generateFitMuxThumbnailToken(
    row.mux_playback_id,
    coerceFitThumbnailTime(row.thumbnail_time),
  )
  if (!token) return null
  return fitMuxThumbnailUrl(row.mux_playback_id, token)
}

async function loadPosterRows(ids: string[]): Promise<PosterRow[] | null> {
  try {
    const { adminClient } = await import('@/lib/supabase/admin')
    const { data, error } = await adminClient
      .from('fit_moves')
      .select('id, status, video_status, mux_playback_id, thumbnail_time')
      .in('id', ids)
    if (error || !data) {
      if (error) console.error('[fit] poster lookup failed:', error.message)
      return null
    }
    return data as PosterRow[]
  } catch (err) {
    const message = err instanceof Error ? err.message : 'poster lookup failed'
    console.error('[fit] poster lookup failed:', message)
    return null
  }
}

/**
 * Adds a thumbnail poster to each move. The returned objects never include
 * a playback token, a playback id field, or a video URL.
 */
export async function attachLockedFitPosters(moves: readonly FitMove[]): Promise<FitMove[]> {
  if (moves.length === 0) return []
  const rows = await loadPosterRows(moves.map(move => move.id))
  if (!rows) return moves.map(move => withoutPlaybackSecrets(move, null))
  const byId = new Map(rows.map(row => [row.id, row]))
  const next: FitMove[] = []
  for (const move of moves) {
    next.push(withoutPlaybackSecrets(move, await posterForRow(byId.get(move.id))))
  }
  return next
}

/** VIP and Pro keep the player path. Everyone else gets thumbnail posters only. */
export async function fitMovesForViewer(
  moves: readonly FitMove[],
  viewerTier: string | null | undefined,
): Promise<FitMove[]> {
  if (canAccessFitLibrary(viewerTier)) return moves.map(move => ({ ...move }))
  return attachLockedFitPosters(moves)
}
