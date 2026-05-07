import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { EventForm } from '../../EventForm'

interface Props {
  params: { eventId: string }
}

export const dynamic = 'force-dynamic'

export default async function EditEventPage({ params }: Props) {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // RLS-FIX: adminClient — events_select_authenticated filters drafts,
  // causing false 404s when an admin opens an unpublished event.
  const { data: row } = await adminClient
    .from('events')
    .select('id, title, description, tagline, cta_text, pillar, event_type, starts_at, ends_at, zoom_url, recording_url, image_url, required_tier, tier_access, is_published')
    .eq('id', params.eventId)
    .single()

  if (!row) notFound()

  // events.pillar is stored as an integer 1-6; the form's <select> uses the
  // matching slug vocabulary (foundation/identity/…). Reverse-map for the
  // initial value so existing events round-trip cleanly through the editor.
  const PILLAR_NUMBER_TO_SLUG: Record<number, string> = {
    1: 'foundation', 2: 'identity', 3: 'mental',
    4: 'strategy',   5: 'accountability', 6: 'execution',
  }
  const pillarSlug = typeof row.pillar === 'number' ? PILLAR_NUMBER_TO_SLUG[row.pillar] ?? '' : ''

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
          tagline: (row as { tagline?: string | null }).tagline ?? '',
          ctaText: (row as { cta_text?: string | null }).cta_text ?? '',
          pillar: pillarSlug,
          eventType: row.event_type as 'live' | 'virtual' | 'inperson',
          startsAt: row.starts_at,
          endsAt: row.ends_at ?? '',
          zoomUrl: row.zoom_url ?? '',
          recordingUrl: row.recording_url ?? '',
          imageUrl: row.image_url ?? '',
          requiredTier: (row.required_tier as 'community' | 'vip' | 'pro' | '') ?? '',
          tierAccess: ((row as { tier_access?: string }).tier_access as 'all' | 'vip' | 'pro' | undefined) ?? 'all',
          isPublished: row.is_published,
        }}
      />
    </div>
  )
}
