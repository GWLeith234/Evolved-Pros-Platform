import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { hasTierAccess } from '@/lib/tier'
import type { EventItem, EventType } from '@/lib/events/types'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { EVENT_PRIVILEGED_COLUMNS, privilegedEventUrls } from '@/lib/events/privilegedUrls'
import { withoutConquerLocal } from '@/lib/events/nextEvent'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: regs } = await adminClient
    .from('event_registrations')
    .select(`event_id, events(${EVENT_PRIVILEGED_COLUMNS})`)
    .eq('user_id', profile.id)
    .order('registered_at', { ascending: true })

  const events: EventItem[] = (regs ?? [])
    .map((r): EventItem | null => {
      const e = r.events as {
        id: string; title: string; description: string | null
        event_type: string; starts_at: string; ends_at: string | null
        zoom_url: string | null; recording_url: string | null
        required_tier: string | null; registration_count: number; is_published: boolean
        image_url: string | null
        city: string | null
      } | null
      if (!e || !e.is_published) return null
      const urls = privilegedEventUrls(e, {
        userTier: profile.tier,
        isRegistered: true,
        isAdmin: profile.role === 'admin',
      })
      return {
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
        isRegistered: true,
        hasAccess: hasTierAccess(profile.tier, e.required_tier as 'community' | 'vip' | 'pro' | null),
        isPublished: e.is_published,
      }
    })
    .filter((e): e is EventItem => e !== null)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
  const visible = withoutConquerLocal(events)

  return NextResponse.json({ events: visible })
}
