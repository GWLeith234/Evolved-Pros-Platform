import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EventDetailHero } from '@/components/events/EventDetailHero'
import { hasTierAccess } from '@/lib/tier'
import type { EventItem, EventType } from '@/lib/events/types'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

export const dynamic = 'force-dynamic'

interface Props {
  params: { eventId: string }
}

export default async function EventDetailPage({ params }: Props) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) redirect('/login')

  const [{ data: row }, regResult] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, zoom_url, recording_url, image_url, required_tier, registration_count, is_published')
      .eq('id', params.eventId)
      .single(),
    supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', profile.id)
      .eq('event_id', params.eventId)
      .maybeSingle(),
  ])

  if (!row) notFound()
  if (!row.is_published && profile.role !== 'admin') notFound()

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
    imageUrl: row.image_url ?? null,
    requiredTier: row.required_tier as 'community' | 'vip' | 'pro' | null,
    registrationCount: row.registration_count,
    isRegistered,
    hasAccess: hasTierAccess(profile.tier as 'community' | 'vip' | 'pro' | null, row.required_tier as 'community' | 'vip' | 'pro' | null),
    isPublished: row.is_published,
  }

  return (
    <div className="px-8 py-6 max-w-4xl mx-auto w-full" style={{ backgroundColor: '#faf9f7', minHeight: '100%' }}>
      <div className="mb-4">
        <a
          href="/events"
          className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
        >
          ← Back to Events
        </a>
      </div>
      <EventDetailHero event={event} />
    </div>
  )
}
