'use client'

import { useState } from 'react'
import type { PodcastEpisode } from '@/lib/podcast/transforms'
import { fmtPodcastDate } from '@/lib/podcast/transforms'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

interface PodcastLatestStripProps {
  episode: PodcastEpisode
}

export function PodcastLatestStrip({ episode }: PodcastLatestStripProps) {
  const [hover, setHover] = useState(false)
  const ctaUrl = episode.youtubeUrl ?? `/podcast/${episode.slug}`
  const ctaTarget = episode.youtubeUrl ? '_blank' : undefined
  const ctaRel = episode.youtubeUrl ? 'noopener noreferrer' : undefined

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-stretch w-full max-w-full overflow-hidden"
      style={{
        borderBottom: '1px solid var(--podcast-border-soft2)',
        background: 'var(--podcast-bg-surface)',
        fontFamily: FB,
      }}
    >
      <div
        className="flex items-center px-4 sm:px-[18px] py-2 sm:py-0 text-[12px] sm:text-[11px]"
        style={{
          background: '#C9302A',
          color: '#fff',
          fontFamily: FBC,
          fontWeight: 800,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        Latest episode
      </div>

      <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-[18px] px-4 sm:px-6 py-2 sm:py-3 min-w-0">
        <span
          className="text-[14px] sm:text-base"
          style={{
            fontFamily: FP,
            fontWeight: 700,
            color: 'var(--podcast-text-strong)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            minWidth: 0,
          }}
        >
          {episode.title}
        </span>
        <span className="hidden sm:block" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--podcast-text-5)', flexShrink: 0 }} />
        <span className="hidden sm:inline" style={{ fontSize: 13, color: 'var(--podcast-text-2)', flexShrink: 0 }}>{episode.guest.name}</span>
        <span className="hidden sm:block" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--podcast-text-5)', flexShrink: 0 }} />
        <span className="hidden sm:inline" style={{ fontSize: 13, color: 'var(--podcast-text-3)', flexShrink: 0 }}>{fmtPodcastDate(episode.releasedAt)}</span>
      </div>

      <a
        href={ctaUrl}
        target={ctaTarget}
        rel={ctaRel}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 px-6 sm:px-[22px] py-2 sm:py-0 text-[12px]"
        style={{
          background: hover ? '#a8231f' : '#C9302A',
          color: '#fff',
          fontFamily: FBC,
          fontWeight: 800,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          flexShrink: 0,
          transition: 'background 120ms ease',
          textDecoration: 'none',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><path d="M3 2 L10 6 L3 10 Z" /></svg>
        Watch on YouTube
      </a>
    </div>
  )
}
