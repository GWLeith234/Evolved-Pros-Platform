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
      style={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '1px solid var(--podcast-border-soft2)',
        background: 'var(--podcast-bg-surface)',
        fontFamily: FB,
      }}
    >
      <div
        style={{
          background: '#C9302A',
          color: '#fff',
          padding: '0 18px',
          display: 'flex',
          alignItems: 'center',
          fontFamily: FBC,
          fontWeight: 800,
          fontSize: 11,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        Latest episode
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '12px 24px',
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontFamily: FP,
            fontSize: 16,
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
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--podcast-text-5)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--podcast-text-2)', flexShrink: 0 }}>{episode.guest.name}</span>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--podcast-text-5)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--podcast-text-3)', flexShrink: 0 }}>{fmtPodcastDate(episode.releasedAt)}</span>
      </div>

      <a
        href={ctaUrl}
        target={ctaTarget}
        rel={ctaRel}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? '#a8231f' : '#C9302A',
          color: '#fff',
          padding: '0 22px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: FBC,
          fontWeight: 800,
          fontSize: 12,
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
