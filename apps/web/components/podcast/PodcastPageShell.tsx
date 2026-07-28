'use client'

import type { PodcastEpisode } from '@/lib/podcast/transforms'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { PodcastThemeBridge } from './PodcastThemeBridge'
import { PodcastLatestStrip } from './PodcastLatestStrip'
import { PodcastMasthead } from './PodcastMasthead'
import { PodcastHero } from './PodcastHero'
import { PodcastGrid } from './PodcastGrid'
import { PodcastTagNav } from './PodcastTagNav'
import { useTheme } from '@/components/theme/ThemeProvider'

interface PodcastPageShellProps {
  episodes: PodcastEpisode[]
  sponsorAds?: SponsorAd[]
  /** Full crawlable topic list for the ?tag= facet (SPRINT L, Task 2). */
  allTags?: string[]
  /** Active ?tag= value, or null when unfiltered. */
  activeTag?: string | null
}

export function PodcastPageShell({ episodes, sponsorAds = [], allTags = [], activeTag = null }: PodcastPageShellProps) {
  const { resolvedTheme } = useTheme()
  const podcastTheme = resolvedTheme === 'light' ? 'parchment' : 'navy'
  const filtering = !!activeTag

  const tagNav = allTags.length ? (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 0' }}>
      <PodcastTagNav allTags={allTags} activeTag={activeTag} />
    </section>
  ) : null

  if (episodes.length === 0) {
    return (
      <div style={{ background: 'var(--podcast-bg-page)', minHeight: '100vh', color: 'var(--podcast-text-strong)' }}>
        <PodcastThemeBridge theme={podcastTheme} />
        <PodcastMasthead />
        {tagNav}
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 96px' }}>
          <p style={{ color: 'var(--podcast-text-3)' }}>
            {filtering ? `No episodes tagged “${activeTag}”.` : 'No episodes published yet.'}
          </p>
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
      {/* Featured "latest" units highlight the newest episode overall — they'd
          be misleading over a filtered subset, so suppress them when a tag
          filter is active and lead with the topic nav + filtered grid. */}
      {!filtering && <PodcastLatestStrip episode={mostRecent} />}
      <PodcastMasthead />
      {!filtering && <PodcastHero episode={latest} />}
      {tagNav}
      <PodcastGrid episodes={episodes} fallbackEpisode={latest} sponsorAds={sponsorAds} />
    </div>
  )
}
