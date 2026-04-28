'use client'

import type { PodcastEpisode } from '@/lib/podcast/transforms'
import { PodcastThemeBridge } from './PodcastThemeBridge'
import { PodcastLatestStrip } from './PodcastLatestStrip'
import { PodcastMasthead } from './PodcastMasthead'
import { PodcastHero } from './PodcastHero'
import { PodcastGrid } from './PodcastGrid'

interface PodcastPageShellProps {
  episodes: PodcastEpisode[]
  shareUrlBase: string
}

export function PodcastPageShell({ episodes, shareUrlBase }: PodcastPageShellProps) {
  if (episodes.length === 0) {
    return (
      <div style={{ background: 'var(--podcast-bg-page)', minHeight: '100vh', color: 'var(--podcast-text-strong)' }}>
        <PodcastThemeBridge theme="parchment" />
        <PodcastMasthead />
        <section style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 96px' }}>
          <p style={{ color: 'var(--podcast-text-3)' }}>No episodes published yet.</p>
        </section>
      </div>
    )
  }

  const latest = episodes.find(e => e.pinned) ?? episodes[0]
  const rest = episodes.filter(e => e.id !== latest.id)
  const shareUrl = `${shareUrlBase}/podcast/${latest.slug}`

  return (
    <div style={{ background: 'var(--podcast-bg-page)', minHeight: '100vh', color: 'var(--podcast-text-strong)' }}>
      <PodcastThemeBridge theme="parchment" />
      <PodcastLatestStrip episode={latest} />
      <PodcastMasthead />
      <PodcastHero episode={latest} shareUrl={shareUrl} />
      <PodcastGrid episodes={rest} />
    </div>
  )
}
