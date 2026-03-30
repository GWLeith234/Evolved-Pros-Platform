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

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const allowed = ['title', 'description', 'event_type', 'starts_at', 'ends_at', 'zoom_url', 'recording_url', 'image_url', 'required_tier', 'is_published'] as const
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('events')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { error: authError } = await requireAdmin(supabase)
  if (authError) return authError

  const { error } = await supabase.from('events').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
