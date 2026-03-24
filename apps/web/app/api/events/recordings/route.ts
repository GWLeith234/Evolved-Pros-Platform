import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { hasTierAccess } from '@/lib/tier'
import type { EventItem, EventType } from '@/lib/events/types'

export const revalidate = 300

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('tier')
    .eq('id', user.id)
    .single()

  const { data: rows, error } = await supabase
    .from('events')
    .select('id, title, description, event_type, starts_at, ends_at, zoom_url, recording_url, required_tier, registration_count, is_published')
    .eq('is_published', true)
    .not('recording_url', 'is', null)
    .lte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 })

  const eventIds = (rows ?? []).map(e => e.id)
  const { data: regs } = eventIds.length > 0
    ? await supabase
        .from('event_registrations')
        .select('event_id')
        .eq('user_id', user.id)
        .in('event_id', eventIds)
    : { data: [] }

  const registeredIds = new Set((regs ?? []).map(r => r.event_id))

  const events: EventItem[] = (rows ?? []).map(e => ({
    id: e.id,
    title: e.title,
    description: e.description,
    eventType: e.event_type as EventType,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    zoomUrl: null,
    recordingUrl: e.recording_url,
    requiredTier: e.required_tier as 'community' | 'pro' | null,
    registrationCount: e.registration_count,
    isRegistered: registeredIds.has(e.id),
    hasAccess: hasTierAccess(profile?.tier, e.required_tier as 'community' | 'pro' | null),
    isPublished: e.is_published,
  }))

  return NextResponse.json({ events })
}
