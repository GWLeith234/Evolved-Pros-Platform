import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { dbRowToEpisode, assertMonotonicNumbering, type EpisodeRow, type ProgressRow } from '@/lib/podcast/transforms'
import { PodcastPageShell } from '@/components/podcast/PodcastPageShell'
import { SPONSOR_AD_COLUMNS, type SponsorAd } from '@/components/home/HomeSponsorAd'
import { ALL_FLAGSHIP_SPONSORS, ensureFlagshipSponsors } from '@/lib/sponsors/partners'
import { dedupeSponsors } from '@/lib/sponsors/rotate'
import { SITE_URL, SERIES_NAME } from '@/lib/podcast/public'

// Public + SEO-indexable, but renders the full editorial podcast experience
// (masthead, hero, album-cover grid, rotating Evolution Partner sponsor cards).
// The route is public (see (public)/podcast/layout.tsx) — logged-out visitors
// and crawlers get the same catalogue; per-user "watched" progress only loads
// when a member is signed in.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: `${SERIES_NAME} — Evolved Pros`,
  description:
    'Long-form conversations on AI, go-to-market, and the evolution of work with George Leith and guests. Full transcripts, chapters, and highlights.',
  alternates: { canonical: `${SITE_URL}/podcast` },
  openGraph: {
    type: 'website',
    title: SERIES_NAME,
    description: 'Long-form conversations on AI, go-to-market, and the evolution of work with George Leith and guests.',
    url: `${SITE_URL}/podcast`,
    siteName: SERIES_NAME,
  },
}

export default async function PublicPodcastIndex() {
  const supabase = createClient()
  // Public page: resolve the member (for "watched" progress) but NEVER redirect.
  const profile = await resolveCurrentUser(supabase).catch(() => null)

  const [episodesRes, progressRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (adminClient as any)
      .from('episodes')
      .select('id, slug, episode_number, title, description, pillar, pinned, guest_name, guest_title, guest_company, guest_image_url, thumbnail_url, duration_seconds, published_at, youtube_url')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .order('episode_number', { ascending: false })
      .limit(100) as Promise<{ data: EpisodeRow[] | null }>,
    profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? ((adminClient as any)
          .from('user_episode_progress')
          .select('episode_id, progress')
          .eq('user_id', profile.id) as Promise<{ data: ProgressRow[] | null }>)
      : Promise.resolve({ data: [] as ProgressRow[] }),
  ])

  const progressByEpisode = new Map<string, ProgressRow>()
  for (const p of progressRes.data ?? []) progressByEpisode.set(p.episode_id, p)

  const episodes = (episodesRes.data ?? []).map(row => dbRowToEpisode(row, progressByEpisode.get(row.id)))
  assertMonotonicNumbering(episodes)

  const sponsorAds = await fetchPodcastSponsorAds()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: SERIES_NAME,
    url: `${SITE_URL}/podcast`,
    description: 'Long-form conversations on AI, go-to-market, and the evolution of work with George Leith and guests.',
    webFeed: `${SITE_URL}/podcast/rss.xml`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PodcastPageShell episodes={episodes} sponsorAds={sponsorAds} />
    </>
  )
}

async function fetchPodcastSponsorAds(): Promise<SponsorAd[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = adminClient as any
  const nowIso = new Date().toISOString()
  // Only active, in-date inventory: null start/end = always-on flight window.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inDate = (q: any) =>
    q
      .eq('is_active', true)
      .or(`start_date.is.null,start_date.lte.${nowIso}`)
      .or(`end_date.is.null,end_date.gte.${nowIso}`)
      .order('sort_order')
      .limit(24)
  try {
    const primary = await inDate(
      sb.from('platform_ads').select(SPONSOR_AD_COLUMNS).in('placement', ['podcast', 'all']),
    )
    const rows = (primary.data ?? []) as SponsorAd[]
    if (rows.length < 2) {
      const fallback = await inDate(sb.from('platform_ads').select(SPONSOR_AD_COLUMNS))
      const seen = new Set(rows.map(r => r.id))
      for (const r of (fallback.data ?? []) as SponsorAd[]) {
        if (!seen.has(r.id)) {
          seen.add(r.id)
          rows.push(r)
        }
      }
    }
    const pool = rows.length ? ensureFlagshipSponsors(rows) : ALL_FLAGSHIP_SPONSORS
    return dedupeSponsors(pool)
  } catch {
    return dedupeSponsors(ALL_FLAGSHIP_SPONSORS)
  }
}
