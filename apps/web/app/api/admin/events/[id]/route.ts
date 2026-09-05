export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { notifyEventPublished } from '@/lib/notifications/fanout'
import { resolveCityStockWithSearch } from '@/lib/events/cityStockFetch'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  // required_tier excluded — tier_access is the new standard
  const allowed = ['title', 'description', 'tagline', 'cta_text', 'pillar', 'event_type', 'starts_at', 'ends_at', 'zoom_url', 'recording_url', 'image_url', 'city', 'tier_access', 'is_published', 'is_draft'] as const
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  const needsCityResolve = 'city' in update || 'image_url' in update
  const publishing = update.is_published === true
  const { data: current } = needsCityResolve || publishing
    ? await adminClient.from('events').select('is_published, city, image_url').eq('id', params.id).maybeSingle()
    : { data: null }

  if (needsCityResolve) {
    const cityStock = await resolveCityStockWithSearch({
      city: 'city' in update
        ? (typeof update.city === 'string' ? update.city : null)
        : current?.city ?? null,
      imageUrl: 'image_url' in update
        ? (typeof update.image_url === 'string' ? update.image_url : null)
        : current?.image_url ?? null,
    })
    update.city = cityStock.city
    update.image_url = cityStock.imageUrl
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
  if (publishing && current && !current.is_published && data.is_published) {
    void notifyEventPublished({
      eventId: data.id,
      title: data.title,
      eventType: data.event_type,
    })
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
