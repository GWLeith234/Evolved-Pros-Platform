import type { Metadata } from 'next'
import { dbRowToEpisode, assertMonotonicNumbering } from '@/lib/podcast/transforms'
import { PodcastPageShell } from '@/components/podcast/PodcastPageShell'
import {
  SITE_URL,
  SERIES_NAME,
  getPodcastCatalogue,
  getPodcastSponsorPool,
} from '@/lib/podcast/public'

// Public catalogue — ISR every 5 minutes. Member chrome is a client island
// (PodcastChrome); this page stays cookie-free for CDN caching.
export const revalidate = 300

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
  const [rows, sponsorAds] = await Promise.all([
    getPodcastCatalogue(),
    getPodcastSponsorPool(),
  ])

  // Watched progress stays 0 on the ISR path (no cookie). Acceptable for SEO /
  // catalogue; member chrome upgrade does not hydrate progress in Phase 2.
  const episodes = rows.map(row => dbRowToEpisode(row, undefined))
  assertMonotonicNumbering(episodes)

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
