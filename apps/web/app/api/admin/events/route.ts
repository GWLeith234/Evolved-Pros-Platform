export const dynamic = 'force-dynamic'

import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { notifyEventPublished } from '@/lib/notifications/fanout'
import { resolveCityStockWithSearch } from '@/lib/events/cityStockFetch'

export async function GET() {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { data, error } = await adminClient
    .from('events')
    .select('id, title, event_type, starts_at, ends_at, required_tier, tier_access, registration_count, is_published, is_draft, recording_url, zoom_url, description, image_url, city')
    .order('starts_at', { ascending: false })

  if (error) {
    console.error('[GET /api/admin/events]', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
  return NextResponse.json({ events: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const eventType = body.event_type as 'live' | 'virtual' | 'inperson' | undefined

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 422 })
  if (!eventType || !['live', 'virtual', 'inperson'].includes(eventType)) {
    return NextResponse.json({ error: 'valid event_type is required' }, { status: 422 })
  }

  const startsAt = typeof body.starts_at === 'string' ? body.starts_at : ''
  if (!startsAt) return NextResponse.json({ error: 'starts_at is required' }, { status: 422 })

  const tierAccess = typeof body.tier_access === 'string' && ['all', 'pro', 'vip'].includes(body.tier_access)
    ? body.tier_access
    : 'all'

  // RLS-FIX: adminClient — events RLS admin-role check breaks for users
  // where auth.uid() ≠ public.users.id.
  const pillar = typeof body.pillar === 'number' && body.pillar >= 1 && body.pillar <= 6
    ? body.pillar
    : null

  const cityStock = await resolveCityStockWithSearch({
    city: typeof body.city === 'string' ? body.city : null,
    imageUrl: typeof body.image_url === 'string' ? body.image_url : null,
  })

  const { data, error } = await adminClient
    .from('events')
    .insert({
      title,
      description: typeof body.description === 'string' ? body.description : null,
      tagline:     typeof body.tagline === 'string'     ? body.tagline     : null,
      cta_text:    typeof body.cta_text === 'string'    ? body.cta_text    : null,
      pillar,
      event_type: eventType,
      starts_at: startsAt,
      ends_at: typeof body.ends_at === 'string' ? body.ends_at : null,
      zoom_url: typeof body.zoom_url === 'string' ? body.zoom_url : null,
      image_url: cityStock.imageUrl,
      city: cityStock.city,
      required_tier: (body.required_tier as 'community' | 'vip' | 'pro' | null) ?? null,
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
  if (data.is_published) {
    void notifyEventPublished({
      eventId: data.id,
      title: data.title,
      eventType: data.event_type,
    })
  }
  return NextResponse.json(data, { status: 201 })
}
