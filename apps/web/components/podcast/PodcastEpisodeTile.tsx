'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PodcastEpisode } from '@/lib/podcast/transforms'
import { fmtPodcastDate, PILLAR_META } from '@/lib/podcast/transforms'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

interface PodcastEpisodeTileProps {
  episode: PodcastEpisode
  focused: boolean
  onFocus: (id: string) => void
  onBlur: () => void
}

export function PodcastEpisodeTile({ episode, focused, onFocus, onBlur }: PodcastEpisodeTileProps) {
  const router = useRouter()
  const tileRef = useRef<HTMLButtonElement | null>(null)
  const [hovered, setHovered] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const pillar = PILLAR_META[episode.pillar]
  const lift = focused || hovered
  const tx = tilt.x * 6
  const ty = tilt.y * 6

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!tileRef.current) return
    const rect = tileRef.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: px, y: py })
  }

  const navigate = () => router.push(`/podcast/${episode.slug}`)

  return (
    <article style={{ display: 'flex', flexDirection: 'column' }}>
      {/* POSTER — 2:3 portrait */}
      <button
        ref={tileRef}
        type="button"
        onMouseEnter={() => { setHovered(true); onFocus(episode.id) }}
        onMouseLeave={() => { setHovered(false); setTilt({ x: 0, y: 0 }); onBlur() }}
        onMouseMove={handleMouseMove}
        onFocus={() => onFocus(episode.id)}
        onBlur={onBlur}
        onClick={navigate}
        aria-label={`Watch ${episode.title}`}
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          aspectRatio: '2 / 3',
          padding: 0,
          background: '#0A0F18',
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
          outline: 'none',
          overflow: 'hidden',
          transform: lift
            ? `perspective(1200px) rotateY(${tx * 0.4}deg) rotateX(${-ty * 0.4}deg) translateY(-6px) scale(1.04)`
            : 'perspective(1200px) rotateY(0) rotateX(0) translateY(0) scale(1)',
          transition: 'transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 280ms ease',
          boxShadow: lift
            ? `0 24px 60px -12px rgba(0,0,0,0.7), 0 0 0 2px ${pillar.color}, 0 0 0 4px rgba(255,255,255,0.12)`
            : '0 1px 0 rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04)',
          zIndex: lift ? 2 : 1,
          willChange: 'transform',
        }}
      >
        {/* Cover art */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: episode.cover ? `url(${episode.cover})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: lift ? `scale(1.08) translate(${tx * -0.6}px, ${ty * -0.6}px)` : 'scale(1) translate(0,0)',
            transition: 'transform 380ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
        />

        {/* Heavy bottom fade for poster legibility */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,15,24,0) 30%, rgba(10,15,24,0.45) 60%, rgba(10,15,24,0.92) 100%)',
          }}
        />

        {/* Pillar accent wash on hover */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${pillar.color}1F 0%, transparent 55%)`,
            opacity: lift ? 1 : 0,
            transition: 'opacity 240ms ease',
          }}
        />

        {/* TOP-LEFT: episode number */}
        {episode.episode > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 16,
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
            }}
          >
            <span
              style={{
                fontFamily: FP,
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 22,
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
                fontSize: 24,
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
        )}

        {/* TOP-RIGHT: NEW / WATCHED */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'flex-end',
          }}
        >
          {episode.isNew && (
            <span
              style={{
                padding: '3px 7px',
                background: '#C9302A',
                color: '#fff',
                fontFamily: FBC,
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              New
            </span>
          )}
          {episode.watched >= 1 && (
            <span
              style={{
                padding: '3px 7px',
                background: 'rgba(10,15,24,0.7)',
                color: '#0ABFA3',
                border: '1px solid rgba(10,191,163,0.45)',
                backdropFilter: 'blur(8px)',
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
              }}
            >
              ✓ Watched
            </span>
          )}
        </div>

        {/* CENTER: play button on hover */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) scale(${lift ? 1 : 0.7})`,
            opacity: lift ? 1 : 0,
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#ef0e30',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 12px 36px rgba(239,14,48,0.5), 0 0 0 8px rgba(255,255,255,0.08)',
            transition: 'all 240ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            pointerEvents: 'none',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 12 12" fill="currentColor">
            <path d="M3.5 2 L10 6 L3.5 10 Z" />
          </svg>
        </span>

        {/* BOTTOM: pillar tag + duration */}
        <div
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: pillar.color,
              textShadow: '0 1px 6px rgba(0,0,0,0.6)',
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: pillar.color,
                flexShrink: 0,
              }}
            />
            {pillar.label}
          </span>
          {episode.duration > 0 && (
            <span
              style={{
                padding: '3px 7px',
                background: 'rgba(10,15,24,0.7)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.16em',
                flexShrink: 0,
              }}
            >
              {episode.duration}M
            </span>
          )}
        </div>

        {/* Watched progress bar (in-progress) */}
        {episode.watched > 0 && episode.watched < 1 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 3,
              background: 'rgba(255,255,255,0.15)',
            }}
          >
            <div
              style={{
                width: `${Math.round(Math.min(1, episode.watched) * 100)}%`,
                height: '100%',
                background: pillar.color,
              }}
            />
          </div>
        )}
      </button>

      {/* META BELOW POSTER (Apple TV pattern) */}
      <div style={{ padding: '14px 2px 0' }}>
        <h3
          style={{
            margin: 0,
            fontFamily: FP,
            fontSize: 16,
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
        {(episode.guest.name || fmtPodcastDate(episode.releasedAt)) && (
          <p
            style={{
              margin: '6px 0 0',
              fontFamily: FB,
              fontSize: 12,
              color: 'var(--podcast-text-3)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'left',
            }}
          >
            {episode.guest.name && <span>{episode.guest.name}</span>}
            {episode.guest.name && fmtPodcastDate(episode.releasedAt) && (
              <span style={{ color: 'var(--podcast-text-5)', margin: '0 6px' }}>·</span>
            )}
            {fmtPodcastDate(episode.releasedAt) && <span>{fmtPodcastDate(episode.releasedAt)}</span>}
          </p>
        )}
      </div>
    </article>
  )
}
