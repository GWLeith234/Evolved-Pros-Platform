'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PodcastEpisode } from '@/lib/podcast/transforms'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'

interface PodcastHeroProps {
  episode: PodcastEpisode
}

function formatRuntime(minutes: number): string {
  if (minutes <= 0) return '—'
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}:${m.toString().padStart(2, '0')}:00`
  }
  return `${minutes}:00`
}

export function PodcastHero({ episode }: PodcastHeroProps) {
  const [hover, setHover] = useState(false)
  const detailHref = `/podcast/${episode.slug}`

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 1280,
        margin: '24px auto 0',
        padding: '0 clamp(16px, 4vw, 24px)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          height: 480,
          overflow: 'hidden',
          background: '#0A0F18',
          borderRadius: 2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: episode.cover ? `url(${episode.cover})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center 28%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(0deg, rgba(10,15,24,0.92) 0%, rgba(10,15,24,0.55) 35%, rgba(10,15,24,0.15) 65%, rgba(10,15,24,0) 100%)',
          }}
        />

        {/* Runtime badge — top right */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            padding: '8px 14px',
            background: 'rgba(10,15,24,0.7)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(10px)',
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>Runtime</span>
          <span>{formatRuntime(episode.duration)}</span>
        </div>

        {/* Title + guest + CTA — bottom left */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: 'clamp(20px, 4vw, 36px)',
            paddingTop: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            maxWidth: '100%',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: FBN,
              fontSize: 'clamp(28px, 4.6vw, 56px)',
              lineHeight: 1.02,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: '#fff',
              maxWidth: '100%',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              textShadow: '0 2px 16px rgba(0,0,0,0.6)',
            }}
          >
            {episode.title}
          </h2>

          {(episode.guest.name || episode.guest.role) && (
            <p
              style={{
                margin: 0,
                fontFamily: FB,
                fontSize: 16,
                lineHeight: 1.4,
                color: 'rgba(255,255,255,0.85)',
                maxWidth: 720,
              }}
            >
              <span style={{ fontWeight: 600, color: '#fff' }}>{episode.guest.name}</span>
              {episode.guest.role && (
                <>
                  <span style={{ margin: '0 10px', color: 'rgba(255,255,255,0.45)' }}>·</span>
                  <span>{episode.guest.role}</span>
                </>
              )}
            </p>
          )}

          <div>
            <Link
              href={detailHref}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              style={{
                padding: '14px 28px',
                background: hover ? '#E03A33' : '#C9302A',
                color: '#fff',
                border: 'none',
                fontFamily: FBC,
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                transition: 'background 120ms ease',
                textDecoration: 'none',
              }}
            >
              Play Episode
              <span aria-hidden style={{ fontSize: 16, lineHeight: 1 }}>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
