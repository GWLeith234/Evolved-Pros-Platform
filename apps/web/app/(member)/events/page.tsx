import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { EventsPageHeader } from '@/components/events/EventsPageHeader'
import { CinematicHero, type HeroEvent } from '@/components/events/CinematicHero'

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')

  // Featured-event query — adminClient guarantees the read regardless of
  // RLS quirks, matching the project's "use adminClient for public-table
  // reads on authenticated render paths" pattern (per Sprint sequence).
  const nowIso = new Date().toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows } = await (adminClient as any)
    .from('events')
    .select('id, title, description, format, pillar, starts_at, hero_image_url, image_url, required_tier, is_featured, attending_count')
    .eq('is_published', true)
    .gt('starts_at', nowIso)
    .order('is_featured', { ascending: false })
    .order('starts_at', { ascending: true })
    .limit(50) as { data: HeroEvent[] | null }

  const featured = pickFeatured(rows ?? [])

  // Look up current RSVP status so the hero CTA hydrates already-correct.
  let initialIsRsvpd = false
  if (featured) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (adminClient as any)
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single() as { data: { id: string } | null }

    if (profile?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rsvp } = await (adminClient as any)
        .from('event_rsvps')
        .select('user_id')
        .eq('user_id', profile.id)
        .eq('event_id', featured.id)
        .maybeSingle() as { data: { user_id: string } | null }
      initialIsRsvpd = Boolean(rsvp)
    }
  }

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100%' }}>
      <EventsPageHeader />
      <CinematicHero event={featured} initialIsRsvpd={initialIsRsvpd} />

      {/* Sprint 2 placeholder — shelves land in EVENTS-SPRINT-2 */}
      <div
        style={{
          margin: '40px 24px',
          padding: '64px 24px',
          border: '1px dashed var(--border-color)',
          borderRadius: 0,
          textAlign: 'center',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          Event shelves — coming in Sprint 2
        </p>
      </div>
    </div>
  )
}
