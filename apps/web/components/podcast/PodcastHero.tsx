'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PodcastEpisode } from '@/lib/podcast/transforms'
import { PILLAR_META, fmtPodcastDate } from '@/lib/podcast/transforms'
import { PodcastShareCluster } from './PodcastShareCluster'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

interface PodcastHeroProps {
  episode: PodcastEpisode
  shareUrl: string
}

export function PodcastHero({ episode, shareUrl }: PodcastHeroProps) {
  const pillar = PILLAR_META[episode.pillar]
  const [watchHover, setWatchHover] = useState(false)
  const detailHref = `/podcast/${episode.slug}`
  const releasedYear = episode.releasedAt.getFullYear()

  return (
    <>
      {/* Image-only banner */}
      <section
        style={{
          position: 'relative',
          height: 460,
          overflow: 'hidden',
          background: '#0A0F18',
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
            background: 'linear-gradient(180deg, rgba(10,15,24,0) 60%, rgba(10,15,24,0.45) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 18% 75%, ${pillar.color}26 0%, transparent 55%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 0,
            right: 0,
            maxWidth: 1280,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          <span
            style={{
              padding: '8px 14px',
              background: 'rgba(10,15,24,0.55)',
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
            <span>{episode.duration}:00</span>
          </span>
        </div>
      </section>

      {/* Intro card */}
      <section
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            background: 'var(--podcast-bg-surface)',
            border: '1px solid var(--podcast-border-soft2)',
            borderTop: `3px solid ${pillar.color}`,
            padding: '36px 40px 32px',
            boxShadow: '0 24px 60px -20px rgba(0,0,0,0.35)',
          }}
        >
          {/* Eyebrow row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px',
                background: 'rgba(201,48,42,0.12)',
                border: '1px solid rgba(201,48,42,0.5)',
                fontFamily: FBC,
                fontWeight: 800,
                fontSize: 10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: '#C9302A',
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#ef0e30',
                  boxShadow: '0 0 8px #ef0e30',
                }}
              />
              Latest episode
            </span>
            <span
              style={{
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: pillar.color,
              }}
            >
              {pillar.label}
            </span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--podcast-text-5)' }} />
            <span
              style={{
                fontFamily: FP,
                fontStyle: 'italic',
                fontSize: 18,
                color: '#C9A84C',
              }}
            >
              Episode #{episode.episode}
            </span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--podcast-text-5)' }} />
            <span
              style={{
                fontFamily: FBC,
                fontWeight: 600,
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--podcast-text-3)',
              }}
            >
              {fmtPodcastDate(episode.releasedAt)}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              margin: 0,
              fontFamily: FP,
              fontWeight: 700,
              fontSize: 'clamp(32px, 4.2vw, 48px)',
              lineHeight: 1.08,
              letterSpacing: '-0.015em',
              color: 'var(--podcast-text-strong)',
              textWrap: 'pretty',
              maxWidth: 880,
            }}
          >
            {episode.title}
          </h1>

          {episode.blurb && (
            <p
              style={{
                margin: '14px 0 0',
                fontFamily: FB,
                fontSize: 17,
                lineHeight: 1.55,
                color: 'var(--podcast-text-2)',
                maxWidth: 720,
              }}
            >
              {episode.blurb}
            </p>
          )}

          {/* Meta row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              marginTop: 24,
              paddingTop: 20,
              flexWrap: 'wrap',
              borderTop: '1px solid var(--podcast-border-soft)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {episode.guest.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={episode.guest.photo}
                  alt={episode.guest.name}
                  style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--podcast-border-med2)', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '2px solid var(--podcast-border-med2)',
                    background: 'var(--podcast-bg-elevated)',
                  }}
                />
              )}
              <div>
                <p style={{ margin: 0, fontFamily: FB, fontSize: 14, fontWeight: 600, color: 'var(--podcast-text-strong)' }}>
                  {episode.guest.name}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontFamily: FBC,
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--podcast-text-3)',
                  }}
                >
                  {episode.guest.role}
                </p>
              </div>
            </div>
            <span style={{ width: 1, height: 28, background: 'var(--podcast-border-soft2)' }} />
            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: FBC,
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--podcast-text-4)',
                }}
              >
                Released
              </p>
              <p style={{ margin: '2px 0 0', fontFamily: FB, fontSize: 13, fontWeight: 600, color: 'var(--podcast-text-strong)' }}>
                {fmtPodcastDate(episode.releasedAt)}, {releasedYear}
              </p>
            </div>
            <span style={{ width: 1, height: 28, background: 'var(--podcast-border-soft2)' }} />
            <div>
              <p
                style={{
                  margin: 0,
                  fontFamily: FBC,
                  fontSize: 9,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'var(--podcast-text-4)',
                }}
              >
                Watch on
              </p>
              <p style={{ margin: '2px 0 0', fontFamily: FB, fontSize: 13, fontWeight: 600, color: 'var(--podcast-text-strong)' }}>
                YouTube &middot; Spotify &middot; Apple
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <Link
              href={detailHref}
              onMouseEnter={() => setWatchHover(true)}
              onMouseLeave={() => setWatchHover(false)}
              style={{
                padding: '14px 28px',
                background: watchHover ? '#ff1a40' : '#ef0e30',
                color: '#fff',
                border: '1px solid #ef0e30',
                fontFamily: FBC,
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 120ms ease',
                textDecoration: 'none',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor"><path d="M3 2 L10 6 L3 10 Z" /></svg>
              Watch episode
            </Link>
            <button
              type="button"
              style={{
                padding: '14px 20px',
                background: 'transparent',
                color: 'var(--podcast-text-strong)',
                border: '1px solid var(--podcast-border-strong)',
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              Save
            </button>
            <PodcastShareCluster title={episode.title} url={shareUrl} />
          </div>
        </div>
      </section>
    </>
  )
}
