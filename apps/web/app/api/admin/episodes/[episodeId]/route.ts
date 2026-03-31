export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { user, error: null }
}

export async function GET(
  _request: Request,
  { params }: { params: { episodeId: string } }
) {
  const supabase = createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const { data, error } = await supabase
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
  const supabase = createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const allowed = [
    'title', 'slug', 'episode_number', 'season', 'description',
    'guest_name', 'guest_title', 'guest_company', 'guest_image_url',
    'mux_playback_id', 'youtube_url', 'thumbnail_url',
    'duration_seconds', 'is_published', 'transcript',
  ] as const

  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  // Auto-set published_at when publishing for first time
  if (update.is_published === true) {
    const { data: existing } = await supabase
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

  const { data, error } = await supabase
    .from('episodes')
    .update(update)
    .eq('id', params.episodeId)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { episodeId: string } }
) {
  const supabase = createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const { error } = await supabase.from('episodes').delete().eq('id', params.episodeId)
  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
