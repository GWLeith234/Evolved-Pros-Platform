import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { EventsPageHeader } from '@/components/events/EventsPageHeader'
import { CinematicHero, type HeroEvent } from '@/components/events/CinematicHero'
import { UpcomingEventsList } from '@/components/events/UpcomingEventsList'

export const metadata: Metadata = { title: 'Events — Evolved Pros' }
export const dynamic = 'force-dynamic'

// EVENTS-SPRINT-1 ordering rule:
//   1) is_featured DESC (true wins)
//   2) format priority: live=1, in-person=2, podcast=3, else=4
//   3) starts_at ASC (soonest first)
function pickFeatured(rows: HeroEvent[]): HeroEvent | null {
  if (rows.length === 0) return null
  const formatRank: Record<string, number> = {
    'live':      1,
    'in-person': 2,
    'podcast':   3,
    'replay':    4,
  }
  const sorted = [...rows].sort((a, b) => {
    const af = a.is_featured ? 0 : 1
    const bf = b.is_featured ? 0 : 1
    if (af !== bf) return af - bf
    const ar = formatRank[a.format] ?? 5
    const br = formatRank[b.format] ?? 5
    if (ar !== br) return ar - br
    return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  })
  return sorted[0] ?? null
}

export default async function EventsPage() {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) redirect('/login')

  const nowIso = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (adminClient as any)
    .from('events')
    .select('id, title, description, tagline, cta_text, format, event_type, pillar, starts_at, hero_image_url, image_url, required_tier, is_featured, attending_count, host_name, host_role, host_avatar_url, price_cents, watermark')
    .eq('is_published', true)
    .gt('starts_at', nowIso)
    .order('is_featured', { ascending: false })
    .order('starts_at', { ascending: true })
    .limit(20) as { data: HeroEvent[] | null }

  const allUpcoming = rows ?? []
  const featured = pickFeatured(allUpcoming)
  const upcoming = featured
    ? allUpcoming.filter(e => e.id !== featured.id).slice(0, 5)
    : []

  // RSVP set covers featured + upcoming so both surfaces hydrate already-correct.
  const idsToCheck = [
    ...(featured ? [featured.id] : []),
    ...upcoming.map(e => e.id),
  ]
  let registeredIds: string[] = []
  if (idsToCheck.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rsvps } = await (adminClient as any)
      .from('event_rsvps')
      .select('event_id')
      .eq('user_id', profile.id)
      .in('event_id', idsToCheck) as { data: { event_id: string }[] | null }
    registeredIds = (rsvps ?? []).map(r => r.event_id)
  }
  const initialIsRsvpd = featured ? registeredIds.includes(featured.id) : false

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100%' }}>
      <EventsPageHeader />
      <CinematicHero event={featured} initialIsRsvpd={initialIsRsvpd} />
      <UpcomingEventsList events={upcoming} registeredIds={registeredIds} />
    </div>
  )
}
