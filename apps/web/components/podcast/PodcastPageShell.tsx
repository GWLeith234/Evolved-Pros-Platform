'use client'

import type { PodcastEpisode } from '@/lib/podcast/transforms'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { PodcastThemeBridge } from './PodcastThemeBridge'
import { PodcastLatestStrip } from './PodcastLatestStrip'
import { PodcastMasthead } from './PodcastMasthead'
import { PodcastHero } from './PodcastHero'
import { PodcastGrid } from './PodcastGrid'
import { useTheme } from '@/components/theme/ThemeProvider'

interface PodcastPageShellProps {
  episodes: PodcastEpisode[]
  sponsorAds?: SponsorAd[]
}

export function PodcastPageShell({ episodes, sponsorAds = [] }: PodcastPageShellProps) {
  const { resolvedTheme } = useTheme()
  const podcastTheme = resolvedTheme === 'light' ? 'parchment' : 'navy'

  if (episodes.length === 0) {
    return (
      <div style={{ background: 'var(--podcast-bg-page)', minHeight: '100vh', color: 'var(--podcast-text-strong)' }}>
        <PodcastThemeBridge theme={podcastTheme} />
        <PodcastMasthead />
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 96px' }}>
          <p style={{ color: 'var(--podcast-text-3)' }}>No episodes published yet.</p>
        </section>
      </div>
    )
  }

  const latest = episodes.find(e => e.pinned) ?? episodes[0]
  // The LATEST EPISODE strip must always track the most-recently-published
  // episode regardless of pin state — episodes are already ordered
  // published_at desc by the page-level query.
  const mostRecent = episodes[0]

  // The Archive grid is the canonical "all episodes" surface. Previously
  // we excluded `latest` to avoid double-displaying it under the hero —
  // but that meant a freshly-launched podcast with one episode showed
  // an empty "Nothing in this pillar yet" state when the user clicked
  // ALL EPISODES. Include everything; the hero is a different visual
  // unit and a duplicate appearance in the grid is fine while the
  // catalogue is small.
  return (
    <div style={{ background: 'var(--podcast-bg-page)', minHeight: '100vh', color: 'var(--podcast-text-strong)' }}>
      <PodcastThemeBridge theme={podcastTheme} />
      <PodcastLatestStrip episode={mostRecent} />
      <PodcastMasthead />
      <PodcastHero episode={latest} />
      <PodcastGrid episodes={episodes} fallbackEpisode={latest} sponsorAds={sponsorAds} />
    </div>
  )
}
