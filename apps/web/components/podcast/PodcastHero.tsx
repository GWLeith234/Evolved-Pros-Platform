'use client'

import { useState } from 'react'
import type { PodcastEpisode } from '@/lib/podcast/transforms'
import { fmtPodcastDate, PILLAR_META } from '@/lib/podcast/transforms'

const FB = 'var(--font-barlow)'
const FBC = 'var(--font-barlow-condensed)'
const FBN = 'var(--font-bebas)'

interface PodcastHeroProps {
  episode: PodcastEpisode
}

function formatRuntime(minutes: number): string {
  if (minutes <= 0) return ''
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}:${m.toString().padStart(2, '0')}:00`
  }
  return `${minutes}:00`
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

const SHARE_ICONS: Array<{ key: string; label: string; path: React.ReactNode }> = [
  {
    key: 'x',
    label: 'Share on X',
    path: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  },
  {
    key: 'linkedin',
    label: 'Share on LinkedIn',
    path: <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.268 2.37 4.268 5.455v6.288zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />,
  },
  {
    key: 'facebook',
    label: 'Share on Facebook',
    path: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
  },
]

export function PodcastHero({ episode }: PodcastHeroProps) {
  const [watchHover, setWatchHover] = useState(false)
  const detailHref = `/podcast/${episode.slug}`
  const pillar = PILLAR_META[episode.pillar]

  // WATCH EPISODE goes straight to YouTube when we have a link; otherwise it
  // falls back to the in-app episode detail page.
  const watchUrl = episode.youtubeUrl ?? detailHref
  const watchExternal = Boolean(episode.youtubeUrl)

  return (
    <section
      style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '40px 24px 8px',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div
        className="podcast-hero-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: 44,
          alignItems: 'center',
        }}
      >
        {/* ── COVER POSTER (2:3, crisp) ─────────────────────────── */}
        <div
          className="podcast-hero-cover"
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '2 / 3',
            borderRadius: 0,
            overflow: 'hidden',
            background: 'var(--podcast-bg-page)',
            border: '1px solid var(--podcast-border-soft2)',
            borderTop: `3px solid ${pillar.color}`,
          }}
        >
          {episode.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={episode.cover}
              alt={episode.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: FBN,
                fontSize: 40,
                letterSpacing: '0.04em',
                color: 'var(--podcast-text-5)',
              }}
            >
              {getInitials(episode.guest.name || episode.title)}
            </div>
          )}

          {/* NEW flag — newest episode within the new-window */}
          {episode.isNew && (
            <span
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                padding: '4px 9px',
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

          {/* Runtime chip — bottom-right over the poster */}
          {episode.duration > 0 && (
            <span
              style={{
                position: 'absolute',
                bottom: 14,
                right: 14,
                padding: '4px 9px',
                background: 'rgba(10,15,24,0.7)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.16em',
              }}
            >
              {episode.duration}M
            </span>
          )}
        </div>

        {/* ── CONTENT ───────────────────────────────────────────── */}
        <div style={{ minWidth: 0 }}>
          {/* Eyebrow: LATEST EPISODE · pillar · #N · date · runtime */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px',
                background: 'color-mix(in srgb, var(--brand-red) 12%, transparent)',
                border: '1px solid color-mix(in srgb, var(--brand-red) 50%, transparent)',
                fontFamily: FBC,
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--brand-red)',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-red)' }} />
              {episode.pinned ? 'Featured' : 'Latest episode'}
            </span>
            <span
              style={{
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                color: pillar.color,
              }}
            >
              {pillar.label}
            </span>
            {episode.episode > 0 ? (
              <>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--podcast-text-5)' }} />
                <span
                  style={{
                    fontFamily: FBC,
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--brand-gold)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  Episode #{String(episode.episode).padStart(2, '0')}
                </span>
              </>
            ) : (
              <>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--podcast-text-5)' }} />
                <span
                  style={{
                    fontFamily: FBC,
                    fontWeight: 800,
                    fontSize: 13,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--brand-gold)',
                  }}
                >
                  Pilot
                </span>
              </>
            )}
            {fmtPodcastDate(episode.releasedAt) && (
              <>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--podcast-text-5)' }} />
                <span
                  style={{
                    fontFamily: FBC,
                    fontWeight: 600,
                    fontSize: 12,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    color: 'var(--podcast-text-3)',
                  }}
                >
                  {fmtPodcastDate(episode.releasedAt)}
                </span>
              </>
            )}
            {episode.duration > 0 && (
              <span
                style={{
                  padding: '3px 10px',
                  background: 'var(--podcast-bg-surface)',
                  border: '1px solid var(--podcast-border-soft2)',
                  fontFamily: FBC,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--podcast-text-2)',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatRuntime(episode.duration)}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            style={{
              margin: 0,
              fontFamily: FB,
              fontWeight: 700,
              fontSize: 'clamp(28px, 4vw, 46px)',
              lineHeight: 1.1,
              letterSpacing: '-0.015em',
              color: 'var(--podcast-text-strong)',
              overflowWrap: 'break-word',
            }}
          >
            {episode.title}
          </h1>

          {/* Blurb */}
          {episode.blurb && (
            <p
              style={{
                margin: '14px 0 0',
                fontFamily: FB,
                fontSize: 16,
                lineHeight: 1.55,
                color: 'var(--podcast-text-2)',
                maxWidth: 640,
              }}
            >
              {episode.blurb}
            </p>
          )}

          {/* Guest row */}
          {episode.guest.name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 24 }}>
              {episode.guest.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={episode.guest.photo}
                  alt={episode.guest.name}
                  style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid var(--podcast-border-med2)', objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: '2px solid var(--podcast-border-med2)',
                    background: 'var(--navy)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: FBC,
                    fontWeight: 800,
                    fontSize: 13,
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {getInitials(episode.guest.name)}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontFamily: FB, fontSize: 14, fontWeight: 600, color: 'var(--podcast-text-strong)' }}>
                  {episode.guest.name}
                </p>
                {episode.guest.role && (
                  <p
                    style={{
                      margin: 0,
                      fontFamily: FBC,
                      fontSize: 11,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--podcast-text-3)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {episode.guest.role}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <a
              href={watchUrl}
              target={watchExternal ? '_blank' : undefined}
              rel={watchExternal ? 'noopener noreferrer' : undefined}
              onMouseEnter={() => setWatchHover(true)}
              onMouseLeave={() => setWatchHover(false)}
              style={{
                padding: '14px 28px',
                background: watchHover ? 'var(--brand-red-hover)' : 'var(--brand-red)',
                color: '#fff',
                border: '1px solid var(--brand-red)',
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
              <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                <path d="M3 2 L10 6 L3 10 Z" />
              </svg>
              Watch episode
            </a>

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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              Save
            </button>

            {/* Share — channel-icon group */}
            <div style={{ display: 'inline-flex', alignItems: 'stretch', border: '1px solid var(--podcast-border-strong)', height: 46 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '0 14px',
                  fontFamily: FBC,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'var(--podcast-text-3)',
                  borderRight: '1px solid var(--podcast-border-soft2)',
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share
              </span>
              {SHARE_ICONS.map((c, i) => (
                <button
                  key={c.key}
                  type="button"
                  title={c.label}
                  aria-label={c.label}
                  style={{
                    width: 44,
                    height: '100%',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    color: 'var(--podcast-text-2)',
                    border: 'none',
                    borderLeft: i === 0 ? 'none' : '1px solid var(--podcast-border-soft)',
                    cursor: 'pointer',
                    transition: 'background 120ms ease, color 120ms ease',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    {c.path}
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: stack the cover above the content, cap its width, keep
          tap targets and the runtime chip from overflowing. */}
      <style>{`
        @media (max-width: 600px) {
          .podcast-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .podcast-hero-cover {
            max-width: 220px !important;
            margin: 0 auto !important;
          }
        }
      `}</style>
    </section>
  )
}
