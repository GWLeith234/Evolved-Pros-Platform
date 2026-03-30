import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EventsContent } from '@/components/events/EventsContent'
import { hasTierAccess, hasKeynoteAccess } from '@/lib/tier'
import type { EventItem, EventType } from '@/lib/events/types'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch profile and all events in parallel
  const [{ data: profile }, { data: rows }, { data: regs }] = await Promise.all([
    supabase.from('users').select('tier, keynote_access').eq('id', user.id).single(),
    supabase
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, zoom_url, recording_url, image_url, required_tier, registration_count, is_published, event_type_keynote')
      .neq('is_published', false)
      .order('starts_at', { ascending: true })
      .limit(100),
    supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', user.id),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registeredSet = new Set((regs ?? []).map((r: any) => r.event_id as string))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const events: EventItem[] = (rows ?? []).map((e: any) => {
    const isRegistered = registeredSet.has(e.id)
    return {
      id: e.id,
      title: e.title,
      description: e.description,
      eventType: e.event_type as EventType,
      startsAt: e.starts_at,
      endsAt: e.ends_at,
      zoomUrl: isRegistered ? e.zoom_url : null,
      recordingUrl: e.recording_url,
      imageUrl: e.image_url ?? null,
      requiredTier: e.required_tier as 'community' | 'pro' | null,
      registrationCount: e.registration_count,
      isRegistered,
      hasAccess: e.event_type_keynote
        ? hasKeynoteAccess({ keynote_access: profile?.keynote_access, tier: profile?.tier })
        : hasTierAccess(profile?.tier, e.required_tier as 'vip' | 'pro' | null),
      isPublished: e.is_published,
    }
  })

  const registeredEventIds: string[] = Array.from(registeredSet)

  return (
    <EventsContent
      events={events}
      registeredEventIds={registeredEventIds}
      userTier={profile?.tier ?? null}
      registrationCount={registeredEventIds.length}
    />
  )
}
