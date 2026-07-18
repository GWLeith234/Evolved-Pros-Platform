import type { Metadata } from 'next'
import { PodcastIndexFilter, type EpisodeCard } from '@/components/podcast/public/PodcastIndexFilter'
import {
  SITE_URL,
  SERIES_NAME,
  getPublishedEpisodes,
  ytThumb,
  summaryText,
  formatDate,
} from '@/lib/podcast/public'

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

const IVORY = '#F5F0E8'

export default async function PublicPodcastIndex() {
  const episodes = await getPublishedEpisodes()

  const cards: EpisodeCard[] = episodes.map(e => ({
    slug: e.slug,
    title: e.title,
    guestName: e.guest_name,
    summary: summaryText(e),
    tags: e.tags,
    thumb: ytThumb(e.youtube_id, 'hq'),
    episodeNumber: e.episode_number,
    dateLabel: formatDate(e.published_at),
  }))

  // Distinct tags across published episodes, most-common first.
  const counts = new Map<string, number>()
  for (const e of episodes) for (const t of e.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: SERIES_NAME,
    url: `${SITE_URL}/podcast`,
    description: 'Long-form conversations on AI, go-to-market, and the evolution of work with George Leith and guests.',
    webFeed: `${SITE_URL}/podcast/rss.xml`,
  }

  return (
    <div style={{ background: '#0A0F18', minHeight: '100%', color: IVORY }}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-10">
          <p className="font-condensed text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: '#ef0e30' }}>
            Podcast
          </p>
          <h1 className="mt-2 font-condensed text-[36px] font-bold leading-tight sm:text-[46px]" style={{ color: IVORY }}>
            {SERIES_NAME}
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed" style={{ color: 'rgba(245,240,232,0.55)' }}>
            Long-form conversations on AI, go-to-market, and the evolution of work — with full transcripts, chapters, and highlights.
            <a href="/podcast/rss.xml" className="ml-2 whitespace-nowrap" style={{ color: '#ef0e30', textDecoration: 'none' }}>RSS feed →</a>
          </p>
        </div>

        {cards.length === 0 ? (
          <p className="py-16 text-center font-condensed uppercase tracking-widest" style={{ color: 'rgba(245,240,232,0.35)' }}>
            No episodes published yet.
          </p>
        ) : (
          <PodcastIndexFilter episodes={cards} tags={tags} />
        )}
      </div>
    </div>
  )
}
