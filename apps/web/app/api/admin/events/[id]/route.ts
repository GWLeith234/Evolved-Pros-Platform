export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  // required_tier excluded — tier_access is the new standard
  const allowed = ['title', 'description', 'tagline', 'cta_text', 'pillar', 'event_type', 'starts_at', 'ends_at', 'zoom_url', 'recording_url', 'image_url', 'tier_access', 'is_published', 'is_draft'] as const
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 422 })
  }

  // RLS-FIX: adminClient — see events/route.ts.
  const { data, error } = await adminClient
    .from('events')
    .update(update)
    .eq('id', params.id)
    .select()
    .single()

  if (error || !data) {
    console.error('[PATCH /api/admin/events/[id]]', error)
    return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { error } = await adminClient.from('events').delete().eq('id', params.id)
  if (error) {
    console.error('[DELETE /api/admin/events/[id]]', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
  return new NextResponse(null, { status: 204 })
}
