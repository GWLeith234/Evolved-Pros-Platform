export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { hasTierAccess } from '@/lib/tier'
import type { EventItem, EventType } from '@/lib/events/types'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { EVENT_PRIVILEGED_COLUMNS, privilegedEventUrls } from '@/lib/events/privilegedUrls'

export async function GET(
  _request: Request,
  { params }: { params: { eventId: string } }
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [eventResult, regResult] = await Promise.all([
    adminClient
      .from('events')
      .select(EVENT_PRIVILEGED_COLUMNS)
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
  const urls = privilegedEventUrls(e, {
    userTier: profile.tier,
    isRegistered,
    isAdmin: profile.role === 'admin',
  })

  const event: EventItem = {
    id: e.id,
    title: e.title,
    description: e.description,
    eventType: e.event_type as EventType,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    zoomUrl: urls.zoomUrl,
    recordingUrl: urls.recordingUrl,
    imageUrl: e.image_url,
    city: e.city ?? null,
    requiredTier: e.required_tier as 'community' | 'vip' | 'pro' | null,
    registrationCount: e.registration_count,
    isRegistered,
    hasAccess: access,
    isPublished: e.is_published,
  }

  return NextResponse.json(event)
}
