import type { Metadata } from 'next'
import Link from 'next/link'
import { adminClient } from '@/lib/supabase/admin'
import { mediaSectionTitle } from '@/lib/media/brand'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { MediaCenteredAd } from '@/components/media/MediaIabSlot'
import { getActivePlatformAds } from '@/lib/cache/shared'
import { pickCommunityFeedAds } from '@/lib/sponsors/partners'
import { adMatchesSurface } from '@/lib/ads/iab'
import { COMMUNITY_AD_EVERY, interleaveAds } from '@/lib/ads/rhythm'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

export const revalidate = 120

export const metadata: Metadata = publicPageMetadata('/media/events', {
  title: mediaSectionTitle('Events'),
  description: 'Upcoming and past events from Evolved Pros. Workshops, keynotes, and networking for sales professionals.',
})

// ── Types ────────────────────────────────────────────────────────────────────

interface EventRow {
  id: string
  title: string
  description: string | null
  event_type: string | null
  starts_at: string
  ends_at: string | null
  zoom_url: string | null
  recording_url: string | null
  image_url: string | null
  required_tier: string | null
  registration_count: number
  is_published: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function monthAbbrev(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
}

function dayNum(iso: string): string {
  return new Date(iso).getDate().toString()
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function isVirtual(ev: EventRow): boolean {
  return !!ev.zoom_url || ev.event_type === 'virtual' || ev.event_type === 'webinar'
}

function tierLabel(tier: string | null): string {
  if (!tier || tier === 'community') return 'All members'
  if (tier === 'vip') return 'VIP+'
  if (tier === 'pro') return 'Pro'
  return tier
}

function isTierGated(tier: string | null): boolean {
  return tier === 'vip' || tier === 'pro'
}

// ── Event card ───────────────────────────────────────────────────────────────

function EventCard({ ev, isPast }: { ev: EventRow; isPast?: boolean }) {
  const virtual = isVirtual(ev)
  const gated = isTierGated(ev.required_tier)
  const eventHref = isPast && ev.recording_url ? ev.recording_url : '/events'

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #E0D8CC', borderRadius: 4, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 14, opacity: isPast ? 0.65 : 1 }}>
      {/* Date block */}
      <div style={{ width: 44, flexShrink: 0, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 9, color: '#C9302A', textTransform: 'uppercase' }}>
          {monthAbbrev(ev.starts_at)}
        </div>
        <div style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, fontSize: 24, color: '#2B3A5A', lineHeight: 1 }}>
          {dayNum(ev.starts_at)}
        </div>
      </div>

      {/* Middle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 14, color: '#2B3A5A', margin: '0 0 3px', lineHeight: 1.25 }}>
          {ev.title}
        </p>
        <p suppressHydrationWarning style={{ fontSize: 10, color: 'rgba(43,58,90,0.5)', fontFamily: 'var(--font-body)', margin: '0 0 6px' }}>
          {formatEventDate(ev.starts_at)} · {formatEventTime(ev.starts_at)}
          {virtual ? ' · Virtual' : ' · In-person'}
        </p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {/* Tier pill */}
          {gated ? (
            <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'var(--font-condensed)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 2, backgroundColor: 'rgba(201,168,76,0.15)', color: '#AA8C3C' }}>
              {tierLabel(ev.required_tier)}
            </span>
          ) : (
            <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'var(--font-condensed)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 2, backgroundColor: 'rgba(43,58,90,0.06)', color: 'rgba(43,58,90,0.45)' }}>
              {tierLabel(ev.required_tier)}
            </span>
          )}
          {/* Format pill */}
          <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'var(--font-condensed)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 2, backgroundColor: 'rgba(43,58,90,0.06)', color: 'rgba(43,58,90,0.45)' }}>
            {virtual ? 'Virtual' : 'In-person'}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ flexShrink: 0, alignSelf: 'center' }}>
        {isPast ? (
          ev.recording_url ? (
            <a href={ev.recording_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11, color: '#fff', backgroundColor: '#2B3A5A', padding: '7px 14px', borderRadius: 3, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              Watch replay
            </a>
          ) : (
            <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11, color: 'rgba(43,58,90,0.3)', backgroundColor: 'rgba(43,58,90,0.06)', padding: '7px 14px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
              Replay soon
            </span>
          )
        ) : gated ? (
          <Link href="/pricing" style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11, color: '#AA8C3C', backgroundColor: 'rgba(201,168,76,0.12)', padding: '7px 14px', borderRadius: 3, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            Members only
          </Link>
        ) : (
          <Link href="/events" style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11, color: '#fff', backgroundColor: '#2B3A5A', padding: '7px 14px', borderRadius: 3, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            Register →
          </Link>
        )}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function MediaEventsPage() {
  const now = new Date().toISOString()

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    adminClient
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, zoom_url, recording_url, image_url, required_tier, registration_count, is_published')
      .eq('is_published', true)
      .gte('starts_at', now)
      .order('starts_at', { ascending: true })
      .limit(10),
    adminClient
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, zoom_url, recording_url, image_url, required_tier, registration_count, is_published')
      .eq('is_published', true)
      .lt('starts_at', now)
      .order('starts_at', { ascending: false })
      .limit(5),
  ])

  const upcomingEvents = (upcoming ?? []) as EventRow[]
  const pastEvents = (past ?? []) as EventRow[]
  const catalog = ((await getActivePlatformAds()) as SponsorAd[]).filter(a =>
    adMatchesSurface(a, 'events') || adMatchesSurface(a, 'media'),
  )
  const feedAds = pickCommunityFeedAds(catalog, 8)
  const upcomingChunks = interleaveAds(upcomingEvents, feedAds.slice(0, 4), COMMUNITY_AD_EVERY, {
    trailing: true,
  })
  const pastChunks = interleaveAds(pastEvents, feedAds.slice(4), COMMUNITY_AD_EVERY, { trailing: true })

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 40px' }}>
      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
          Evolved Pros Events
        </p>
        <h1 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, fontSize: 28, color: '#2B3A5A', textTransform: 'uppercase', lineHeight: 1.1, margin: 0 }}>
          Upcoming Events
        </h1>
      </div>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {upcomingChunks.map((chunk, idx) =>
            chunk.kind === 'ad' ? (
              <MediaCenteredAd key={`${chunk.ad.id}-${idx}`} ad={chunk.ad} locationId="media-events" />
            ) : (
              chunk.items.map(ev => <EventCard key={ev.id} ev={ev} />)
            ),
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', border: '1px solid #E0D8CC', borderRadius: 4, padding: '40px 20px', textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: 'rgba(43,58,90,0.4)', fontFamily: 'var(--font-body)' }}>
            No upcoming events right now. Check back soon!
          </p>
        </div>
      )}

      {/* Past events divider */}
      {pastEvents.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 2, backgroundColor: '#2B3A5A', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 13, color: '#2B3A5A', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              Past Events
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(43,58,90,0.15)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pastChunks.map((chunk, idx) =>
              chunk.kind === 'ad' ? (
                <MediaCenteredAd key={`${chunk.ad.id}-p${idx}`} ad={chunk.ad} locationId="media-events" />
              ) : (
                chunk.items.map(ev => <EventCard key={ev.id} ev={ev} isPast />)
              ),
            )}
          </div>
        </>
      )}
    </div>
  )
}
