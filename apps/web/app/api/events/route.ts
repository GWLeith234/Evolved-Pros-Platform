import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { hasTierAccess } from '@/lib/tier'
import type { EventItem, EventType } from '@/lib/events/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const typeFilter = searchParams.get('type') as EventType | null
  const upcomingOnly = searchParams.get('upcoming') !== 'false'
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100)
  const cursor = searchParams.get('cursor') ?? ''

  // Fetch user profile for tier
  const { data: profile } = await supabase
    .from('users')
    .select('tier')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('events')
    .select('id, title, description, event_type, starts_at, ends_at, zoom_url, recording_url, required_tier, registration_count, is_published')
    .eq('is_published', true)
    .order('starts_at', { ascending: upcomingOnly })
    .limit(limit + 1)

  if (upcomingOnly) {
    query = query.gt('starts_at', new Date().toISOString())
  } else {
    query = query.lte('starts_at', new Date().toISOString())
  }

  if (typeFilter) query = query.eq('event_type', typeFilter)
  if (cursor) {
    query = upcomingOnly
      ? query.gt('starts_at', cursor)
      : query.lt('starts_at', cursor)
  }

  const { data: rows, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })

  const allRows = rows ?? []
  const hasMore = allRows.length > limit
  const page = allRows.slice(0, limit)
  const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].starts_at : null

  // Fetch user's registrations for these event IDs
  const eventIds = page.map(e => e.id)
  const { data: regs } = eventIds.length > 0
    ? await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('user_id', user.id)
        .in('event_id', eventIds)
    : { data: [] }

  const registeredIds = new Set((regs ?? []).map(r => r.event_id))

  const events: EventItem[] = page.map(e => {
    const isRegistered = registeredIds.has(e.id)
    const access = hasTierAccess(profile?.tier, e.required_tier as 'community' | 'pro' | null)
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      eventType: e.event_type as EventType,
      startsAt: e.starts_at,
      endsAt: e.ends_at,
      zoomUrl: isRegistered ? e.zoom_url : null,   // only expose when registered
      recordingUrl: e.recording_url,
      requiredTier: e.required_tier as 'community' | 'pro' | null,
      registrationCount: e.registration_count,
      isRegistered,
      hasAccess: access,
      isPublished: e.is_published,
    }
  })

  return NextResponse.json({ events, nextCursor, hasMore })
}
