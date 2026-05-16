'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PodcastEpisode } from '@/lib/podcast/transforms'
import { fmtPodcastDate } from '@/lib/podcast/transforms'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

function formatRuntime(minutes: number): string {
  if (minutes <= 0) return '—'
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}:${m.toString().padStart(2, '0')}:00`
  }
  return `${minutes}:00`
}

interface PodcastEpisodeTileProps {
  episode: PodcastEpisode
  focused: boolean
  onFocus: (id: string) => void
  onBlur: () => void
}

export function PodcastEpisodeTile({ episode, focused, onFocus, onBlur }: PodcastEpisodeTileProps) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const lift = focused || hovered

  // Use the server-computed isNew flag from transforms.ts. Calling
  // Date.now() in the tile body itself caused SSR↔CSR drift and threw
  // React #425/#418 on every grid mount.
  const isNewIn7Days = episode.isNew
  const publishedAtLabel = fmtPodcastDate(episode.releasedAt)

  return (
    <article
      onMouseEnter={() => { setHovered(true); onFocus(episode.id) }}
      onMouseLeave={() => { setHovered(false); onBlur() }}
      onFocus={() => onFocus(episode.id)}
      onBlur={onBlur}
      onClick={() => router.push(`/podcast/${episode.slug}`)}
      role="link"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          router.push(`/podcast/${episode.slug}`)
        }
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transform: lift ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 220ms ease',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          overflow: 'hidden',
          background: '#0A0F18',
          boxShadow: lift
            ? '0 18px 40px -16px rgba(0,0,0,0.45)'
            : '0 4px 12px -6px rgba(0,0,0,0.25)',
          transition: 'box-shadow 220ms ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: episode.cover ? `url(${episode.cover})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: lift ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 380ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,15,24,0.45) 0%, rgba(10,15,24,0) 40%, rgba(10,15,24,0) 100%)',
          }}
        />

        {/* Episode number — top-left overlay */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 14,
            display: 'flex',
            alignItems: 'baseline',
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: FP,
              fontStyle: 'italic',
              fontSize: 20,
              color: '#C9A84C',
              lineHeight: 1,
              textShadow: '0 1px 6px rgba(0,0,0,0.6)',
            }}
          >
            #
          </span>
          <span
            style={{
              fontFamily: FBN,
              fontSize: 26,
              lineHeight: 1,
              color: '#fff',
              letterSpacing: '0.04em',
              fontVariantNumeric: 'tabular-nums',
              textShadow: '0 1px 6px rgba(0,0,0,0.6)',
            }}
          >
            {String(episode.episode).padStart(2, '0')}
          </span>
        </div>

        {/* NEW badge — top-right (last 7 days only) */}
        {isNewIn7Days && (
          <span
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              padding: '3px 8px',
              background: '#C9302A',
              color: '#fff',
              fontFamily: FBC,
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
            }}
          >
            New
          </span>
        )}

        {/* Runtime — bottom-right */}
        <span
          style={{
            position: 'absolute',
            right: 12,
            bottom: 12,
            padding: '3px 8px',
            background: 'rgba(10,15,24,0.78)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.16em',
          }}
        >
          {formatRuntime(episode.duration)}
        </span>
      </div>

      <div style={{ padding: '14px 2px 0' }}>
        <h3
          style={{
            margin: 0,
            fontFamily: FP,
            fontSize: 17,
            fontWeight: 700,
            lineHeight: 1.25,
            color: 'var(--podcast-text-strong)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.5em',
          }}
        >
          {episode.title}
        </h3>
        {(episode.guest.name || episode.guest.role) && (
          <p
            style={{
              margin: '6px 0 0',
              fontFamily: FB,
              fontSize: 12,
              color: 'var(--podcast-text-3)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--podcast-text-2)' }}>{episode.guest.name}</span>
            {episode.guest.role && (
              <>
                <span style={{ margin: '0 6px', color: 'var(--podcast-text-5)' }}>·</span>
                <span>{episode.guest.role}</span>
              </>
            )}
          </p>
        )}
        {(publishedAtLabel || episode.duration > 0) && (
          <p
            style={{
              margin: '4px 0 0',
              fontFamily: FBC,
              fontSize: 12,
              letterSpacing: '0.06em',
              color: 'var(--podcast-text-5)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {publishedAtLabel && <span>{publishedAtLabel}</span>}
            {publishedAtLabel && episode.duration > 0 && (
              <span style={{ margin: '0 6px' }}>·</span>
            )}
            {episode.duration > 0 && <span>{formatRuntime(episode.duration)}</span>}
          </p>
        )}
      </div>
    </article>
  )
}
