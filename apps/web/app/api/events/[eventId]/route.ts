export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { hasTierAccess } from '@/lib/tier'
import type { EventItem, EventType } from '@/lib/events/types'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

export async function GET(
  _request: Request,
  { params }: { params: { eventId: string } }
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [eventResult, regResult] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, zoom_url, recording_url, required_tier, registration_count, is_published, image_url')
      .eq('id', params.eventId)
      .single(),
    supabase
      .from('event_registrations')
      .select('event_id')
      .eq('event_id', params.eventId)
      .eq('user_id', profile.id)
      .maybeSingle(),
  ])

  const e = eventResult.data
  if (!e) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Non-admins cannot see unpublished events
  if (!e.is_published && profile.role !== 'admin') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const isRegistered = !!regResult.data
  const access = hasTierAccess(profile.tier, e.required_tier as 'community' | 'vip' | 'pro' | null)

  const event: EventItem = {
    id: e.id,
    title: e.title,
    description: e.description,
    eventType: e.event_type as EventType,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    zoomUrl: isRegistered ? e.zoom_url : null,
    recordingUrl: e.recording_url,
    imageUrl: e.image_url,
    requiredTier: e.required_tier as 'community' | 'vip' | 'pro' | null,
    registrationCount: e.registration_count,
    isRegistered,
    hasAccess: access,
    isPublished: e.is_published,
  }

  return NextResponse.json(event)
}
