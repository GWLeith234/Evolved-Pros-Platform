import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateICS } from '@/lib/events/types'
import type { EventItem, EventType } from '@/lib/events/types'
import { hasTierAccess } from '@/lib/tier'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { eventId: string } }) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: row }, regResult] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, zoom_url, recording_url, required_tier, registration_count, is_published')
      .eq('id', params.eventId)
      .single(),
    supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', profile.id)
      .eq('event_id', params.eventId)
      .maybeSingle(),
  ])

  if (!row || !row.is_published) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isRegistered = !!regResult.data
  const event: EventItem = {
    id: row.id,
    title: row.title,
    description: row.description,
    eventType: row.event_type as EventType,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    zoomUrl: isRegistered ? row.zoom_url : null,
    recordingUrl: row.recording_url,
    requiredTier: row.required_tier as 'community' | 'vip' | 'pro' | null,
    registrationCount: row.registration_count,
    isRegistered,
    hasAccess: hasTierAccess(profile.tier, row.required_tier as 'community' | 'vip' | 'pro' | null),
    isPublished: row.is_published,
  }

  const ics = generateICS(event)
  const filename = `${row.title.replace(/\s+/g, '-').toLowerCase()}.ics`

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
