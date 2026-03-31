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

export async function GET() {
  const supabase = createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const { data, error } = await supabase
    .from('events')
    .select('id, title, event_type, starts_at, ends_at, required_tier, tier_access, registration_count, is_published, is_draft, recording_url, zoom_url, description, image_url')
    .order('starts_at', { ascending: false })

  if (error) {
    console.error('[GET /api/admin/events]', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
  return NextResponse.json({ events: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const eventType = body.event_type as 'live' | 'virtual' | 'inperson' | undefined

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 422 })
  if (!eventType || !['live', 'virtual', 'inperson'].includes(eventType)) {
    return NextResponse.json({ error: 'valid event_type is required' }, { status: 422 })
  }

  const tierAccess = typeof body.tier_access === 'string' && ['all', 'pro', 'vip'].includes(body.tier_access)
    ? body.tier_access
    : 'all'

  const { data, error } = await supabase
    .from('events')
    .insert({
      title,
      description: typeof body.description === 'string' ? body.description : null,
      event_type: eventType,
      starts_at: typeof body.starts_at === 'string' ? body.starts_at : null,
      ends_at: typeof body.ends_at === 'string' ? body.ends_at : null,
      zoom_url: typeof body.zoom_url === 'string' ? body.zoom_url : null,
      image_url: typeof body.image_url === 'string' ? body.image_url : null,
      required_tier: (body.required_tier as 'community' | 'pro' | null) ?? null,
      tier_access: tierAccess,
      is_published: body.is_published === true,
      is_draft: body.is_draft === true,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[POST /api/admin/events]', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to create event' }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
