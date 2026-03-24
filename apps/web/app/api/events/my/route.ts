import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { hasTierAccess } from '@/lib/tier'
import type { EventItem, EventType } from '@/lib/events/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('tier')
    .eq('id', user.id)
    .single()

  const { data: regs } = await supabase
    .from('event_registrations')
    .select('event_id, events(id, title, description, event_type, starts_at, ends_at, zoom_url, recording_url, required_tier, registration_count, is_published)')
    .eq('user_id', user.id)
    .order('registered_at', { ascending: true })

  const events: EventItem[] = (regs ?? [])
    .map(r => {
      const e = r.events as {
        id: string; title: string; description: string | null
        event_type: string; starts_at: string; ends_at: string | null
        zoom_url: string | null; recording_url: string | null
        required_tier: string | null; registration_count: number; is_published: boolean
      } | null
      if (!e || !e.is_published) return null
      return {
        id: e.id,
        title: e.title,
        description: e.description,
        eventType: e.event_type as EventType,
        startsAt: e.starts_at,
        endsAt: e.ends_at,
        zoomUrl: e.zoom_url,          // user is registered — expose Zoom link
        recordingUrl: e.recording_url,
        requiredTier: e.required_tier as 'community' | 'pro' | null,
        registrationCount: e.registration_count,
        isRegistered: true,
        hasAccess: hasTierAccess(profile?.tier, e.required_tier as 'community' | 'pro' | null),
        isPublished: e.is_published,
      } satisfies EventItem
    })
    .filter((e): e is EventItem => e !== null)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())

  return NextResponse.json({ events })
}
