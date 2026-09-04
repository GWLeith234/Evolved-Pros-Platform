import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { generateICS } from '@/lib/events/types'
import type { EventItem, EventType } from '@/lib/events/types'
import { hasTierAccess } from '@/lib/tier'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { EVENT_PRIVILEGED_COLUMNS, privilegedEventUrls } from '@/lib/events/privilegedUrls'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { eventId: string } }) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: row }, regResult] = await Promise.all([
    adminClient
      .from('events')
      .select(EVENT_PRIVILEGED_COLUMNS)
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
  const urls = privilegedEventUrls(row, {
    userTier: profile.tier,
    isRegistered,
    isAdmin: profile.role === 'admin',
  })
  const event: EventItem = {
    id: row.id,
    title: row.title,
    description: row.description,
    eventType: row.event_type as EventType,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    zoomUrl: urls.zoomUrl,
    recordingUrl: urls.recordingUrl,
    imageUrl: row.image_url,
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
