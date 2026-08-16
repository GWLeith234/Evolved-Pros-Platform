export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

export async function GET(
  _request: Request,
  { params }: { params: { episodeId: string } }
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { data, error } = await adminClient
    .from('episodes')
    .select('*')
    .eq('id', params.episodeId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Episode not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: { episodeId: string } }
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  // CLEAN-C: mux_playback_id, youtube_url, duration_seconds, and
  // thumbnail_url are all explicitly optional on publish. A YouTube-hosted
  // episode (e.g. the Pilot — no Mux asset) is publishable with just title
  // and an optional description. Do NOT reintroduce a require-Mux check
  // here without first wiring a UI alternative for YouTube/audio-only.
  const allowed = [
    'title', 'slug', 'episode_number', 'season', 'description',
    'guest_name', 'guest_title', 'guest_company', 'guest_image_url',
    'mux_playback_id', 'youtube_url', 'audio_url', 'thumbnail_url',
    'duration_seconds', 'is_published', 'transcript',
    'show_notes', 'transistor_episode_id', 'is_members_only', 'pinned',
  ] as const

  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  // Singular `pillar` is canonical (public /podcast reads it). Validate against
  // the constraint set and keep the legacy `pillars` array in sync.
  if ('pillar' in body) {
    const PILLAR_SET = new Set([
      'foundation', 'identity', 'mental-toughness', 'strategy', 'accountability', 'execution',
    ])
    const pillar = typeof body.pillar === 'string' && PILLAR_SET.has(body.pillar) ? body.pillar : null
    update.pillar = pillar
    update.pillars = pillar ? [pillar] : []
  }

  // Auto-set published_at when publishing for first time
  if (update.is_published === true) {
    const { data: existing } = await adminClient
      .from('episodes')
      .select('is_published, published_at')
      .eq('id', params.episodeId)
      .single()
    if (existing && !existing.is_published && !existing.published_at) {
      update.published_at = new Date().toISOString()
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 422 })
  }

  // Pinned is single-occupancy: clear every other row in the same write before
  // setting this one, so at most one episode is ever pinned.
  if (update.pinned === true) {
    await adminClient.from('episodes').update({ pinned: false }).neq('id', params.episodeId)
  }

  // RLS-FIX: adminClient — see episodes/route.ts.
  const { data, error } = await adminClient
    .from('episodes')
    .update(update)
    .eq('id', params.episodeId)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  const { revalidateTag } = await import('next/cache')
  const { CACHE_TAGS } = await import('@/lib/cache/shared')
  revalidateTag(CACHE_TAGS.podcastEpisodes)
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { episodeId: string } }
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { error } = await adminClient.from('episodes').delete().eq('id', params.episodeId)
  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  const { revalidateTag } = await import('next/cache')
  const { CACHE_TAGS } = await import('@/lib/cache/shared')
  revalidateTag(CACHE_TAGS.podcastEpisodes)
  return new NextResponse(null, { status: 204 })
}
