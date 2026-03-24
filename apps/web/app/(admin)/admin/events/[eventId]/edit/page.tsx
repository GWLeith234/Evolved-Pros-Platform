import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EventForm } from '../../EventForm'

interface Props {
  params: { eventId: string }
}

export const dynamic = 'force-dynamic'

export default async function EditEventPage({ params }: Props) {
  const supabase = createClient()

  const { data: row } = await supabase
    .from('events')
    .select('id, title, description, event_type, starts_at, ends_at, zoom_url, recording_url, required_tier, is_published')
    .eq('id', params.eventId)
    .single()

  if (!row) notFound()

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <a
          href="/admin/events"
          className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
        >
          ← Back to Events
        </a>
      </div>
      <h1 className="font-display font-black text-[28px] text-[#112535] mb-6">Edit Event</h1>
      <EventForm
        eventId={row.id}
        initialValues={{
          title: row.title,
          description: row.description ?? '',
          eventType: row.event_type as 'live' | 'virtual' | 'inperson',
          startsAt: row.starts_at,
          endsAt: row.ends_at ?? '',
          zoomUrl: row.zoom_url ?? '',
          recordingUrl: row.recording_url ?? '',
          requiredTier: (row.required_tier as 'community' | 'pro' | '') ?? '',
          isPublished: row.is_published,
        }}
      />
    </div>
  )
}
