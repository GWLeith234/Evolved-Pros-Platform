'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PodcastEpisode } from '@/lib/podcast/transforms'
import { fmtPodcastDate, PILLAR_META } from '@/lib/podcast/transforms'

// Type tokens (PODCAST-CLEANUP S4): Bebas for display numerals, Barlow for
// titles/body, Barlow Condensed for all-caps labels. No Playfair on platform.
const FB = 'var(--font-barlow)'
const FBC = 'var(--font-barlow-condensed)'
const FBN = 'var(--font-bebas)'

interface PodcastEpisodeTileProps {
  episode: PodcastEpisode
  focused: boolean
  onFocus: (id: string) => void
  onBlur: () => void
}

export function PodcastEpisodeTile({ episode, focused, onFocus, onBlur }: PodcastEpisodeTileProps) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)

  const pillar = PILLAR_META[episode.pillar]
  const lift = focused || hovered
  const isPilot = episode.episode <= 0

  const navigate = () => router.push(`/podcast/${episode.slug}`)

  return (
    <article style={{ display: 'flex', flexDirection: 'column' }}>
      {/* POSTER — 2:3 portrait. Flat: sharp corners, no shadow, no 3D tilt.
          Hover lifts 4px and borders in the pillar color (PODCAST-CLEANUP S3). */}
      <button
        className="podcast-tile-cover"
        type="button"
        onMouseEnter={() => { setHovered(true); onFocus(episode.id) }}
        onMouseLeave={() => { setHovered(false); onBlur() }}
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
          background: 'var(--podcast-bg-page)',
          border: `1px solid ${lift ? pillar.color : 'var(--podcast-border-soft2)'}`,
          borderRadius: 0,
          cursor: 'pointer',
          overflow: 'hidden',
          transform: lift ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'transform 200ms ease, border-color 200ms ease',
          zIndex: lift ? 2 : 1,
        }}
      >
        {/* Cover art — subtle flat zoom on hover (no parallax/tilt) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: episode.cover ? `url(${episode.cover})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: lift ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 280ms ease',
          }}
        />

        {/* Cover art is now a plain guest headshot (no baked-in text), so the
            full-image legibility gradient was retired. Overlaid labels carry
            their own small scrims instead (PODCAST-CLEANUP follow-up). */}

        {/* Pillar accent wash on hover — flat tint, no gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `color-mix(in srgb, ${pillar.color} 10%, transparent)`,
            opacity: lift ? 1 : 0,
            transition: 'opacity 240ms ease',
          }}
        />

        {/* TOP-LEFT: episode number, or PILOT chip for the pilot */}
        {isPilot ? (
          <span
            style={{
              position: 'absolute',
              top: 14,
              left: 16,
              padding: '3px 7px',
              background: 'rgba(10,15,24,0.7)',
              color: 'var(--brand-gold)',
              border: '1px solid color-mix(in srgb, var(--brand-gold) 45%, transparent)',
              backdropFilter: 'blur(8px)',
              fontFamily: FBC,
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}
          >
            Pilot
          </span>
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 14,
              left: 16,
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
              padding: '2px 8px',
              background: 'rgba(10,15,24,0.7)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <span
              style={{
                fontFamily: FBN,
                fontSize: 22,
                color: 'var(--brand-gold)',
                lineHeight: 1,
                letterSpacing: '0.04em',
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
                background: 'var(--brand-red)',
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
                color: 'var(--brand-teal)',
                border: '1px solid color-mix(in srgb, var(--brand-teal) 45%, transparent)',
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

        {/* CENTER: play button on hover — round control exception, no glow */}
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
            background: 'var(--brand-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            transition: 'transform 240ms ease, opacity 240ms ease',
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

      {/* META BELOW POSTER (Apple TV pattern). Covers are now plain guest
          headshots, so the guest name is the primary identifier — promoted to a
          clear label directly under the picture, above the episode title. The
          byline below carries the date alone (name no longer duplicated). */}
      <div style={{ padding: '16px 2px 0' }}>
        {episode.guest.name && (
          <p
            style={{
              margin: '0 0 4px',
              fontFamily: FBC,
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--podcast-text-1)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'left',
            }}
          >
            {episode.guest.name}
          </p>
        )}
        <h3
          style={{
            margin: 0,
            fontFamily: FB,
            fontSize: 16,
            fontWeight: 600,
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
        {fmtPodcastDate(episode.releasedAt) && (
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
            {fmtPodcastDate(episode.releasedAt)}
          </p>
        )}
      </div>
    </article>
  )
}
