import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { dbRowToEpisode, assertMonotonicNumbering, type EpisodeRow, type ProgressRow } from '@/lib/podcast/transforms'
import { PodcastPageShell } from '@/components/podcast/PodcastPageShell'
import { SITE_URL, SERIES_NAME, getPodcastSponsorPool } from '@/lib/podcast/public'
import { publicPageMetadata } from '@/lib/seo/canonical'

// Public + SEO-indexable, but renders the full editorial podcast experience
// (masthead, hero, album-cover grid, rotating Evolution Partner sponsor cards).
// The route is public (see (public)/podcast/layout.tsx) — logged-out visitors
// and crawlers get the same catalogue; per-user "watched" progress only loads
// when a member is signed in.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = publicPageMetadata('/podcast', {
  title: `${SERIES_NAME} | Evolved Pros`,
  description:
    'Long-form conversations on AI, go-to-market, and the evolution of work with George Leith and guests. Full transcripts, chapters, and highlights.',
  openGraph: {
    type: 'website',
    title: SERIES_NAME,
    description: 'Long-form conversations on AI, go-to-market, and the evolution of work with George Leith and guests.',
    siteName: SERIES_NAME,
  },
})

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

  const sponsorAds = await getPodcastSponsorPool()

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
