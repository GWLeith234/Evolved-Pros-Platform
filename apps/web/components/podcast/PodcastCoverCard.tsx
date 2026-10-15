import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { PodcastEpisode, PodcastPillar } from '@/lib/podcast/transforms'
import { PILLAR_META, displayEpisodeTitle } from '@/lib/podcast/transforms'

// SPRINT B — the 9:16 cover card. Cream sleeve + navy plate; colours are
// theme-invariant (see --pod-* tokens). Layout: art flex-shrinks, plate is
// content-sized so typography never clips inside overflow:hidden.
const CREAM = 'var(--pod-cream)'
const NAVY = 'var(--pod-navy)'
const WHITE = 'var(--white)'
const WHITE_56 = 'rgba(255,255,255,0.56)'
const DIVIDER = 'rgba(255,255,255,0.16)'

const FBN = 'var(--font-bebas)'
const FBC = 'var(--font-barlow-condensed)'
const FPI = 'var(--font-display)' // Playfair Display

const PILLAR_HEX: Record<PodcastPillar, string> = {
  foundation: 'var(--pillar-1)',
  identity: 'var(--pillar-2)',
  'mental-toughness': 'var(--pillar-3)',
  strategy: 'var(--pillar-4)',
  accountability: 'var(--pillar-5)',
  execution: 'var(--pillar-6)',
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function fmtCardDate(iso: string): string {
  const d = new Date(iso)
  const t = d.getTime()
  if (Number.isNaN(t) || t === 0) return ''
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

interface PodcastCoverCardProps {
  episode: PodcastEpisode
  /** When false (admin preview), the card is inert — no navigation. */
  interactive?: boolean
}

const CARD_STYLE: CSSProperties = {
  position: 'relative',
  width: '100%',
  aspectRatio: '9 / 16',
  background: CREAM,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  textDecoration: 'none',
  color: 'inherit',
  border: '1px solid var(--podcast-border-soft2)',
}

function CoverCardFrame({
  interactive,
  href,
  ariaLabel,
  children,
}: {
  interactive: boolean
  href: string
  ariaLabel: string
  children: ReactNode
}) {
  const className = interactive
    ? 'podcast-cover-card podcast-cover-card--interactive'
    : 'podcast-cover-card'
  // Crawlable first-party URL. A button + router.push leaves the slug in the
  // RSC payload only, so Googlebot never sees hub → episode links.
  if (interactive) {
    return (
      <Link href={href} className={className} aria-label={ariaLabel} style={{ ...CARD_STYLE, cursor: 'pointer' }}>
        {children}
      </Link>
    )
  }
  return (
    <article className={className} style={{ ...CARD_STYLE, cursor: 'default' }}>
      {children}
    </article>
  )
}

export function PodcastCoverCard({ episode, interactive = true }: PodcastCoverCardProps) {
  const guestName = episode.guest.name?.trim() || ''
  const isPilot = !guestName
  // Prefer guest portrait; fall back to episode cover/thumbnail so we never
  // render a blank cream void when art exists.
  const artUrl = episode.guest.photo || episode.cover
  const showArt = !!artUrl

  const pillarHex = PILLAR_HEX[episode.pillar] ?? PILLAR_HEX.foundation
  const pillarLabel = (PILLAR_META[episode.pillar]?.label ?? 'Foundation').toUpperCase()
  const kicker = isPilot
    ? `PILOT · ${pillarLabel}`
    : `EP ${String(episode.episode).padStart(2, '0')} · ${pillarLabel}`

  const headline = isPilot ? 'THE EVOLVED PROS PODCAST' : guestName
  const title = displayEpisodeTitle(episode.title, episode.guest.name)

  const dateStr = fmtCardDate(episode.releasedAt)
  const metaParts = [dateStr, episode.duration > 0 ? `${episode.duration} MIN` : ''].filter(Boolean)
  const metaLine = metaParts.join(' · ')

  return (
    <CoverCardFrame
      interactive={interactive}
      href={`/podcast/${episode.slug}`}
      ariaLabel={`Watch ${headline}: ${title}`}
    >
      {/* ART — flex-shrinks so the navy plate always keeps its full height */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          flex: '1 1 0',
          minHeight: 0,
          background: CREAM,
          overflow: 'hidden',
        }}
      >
        {showArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artUrl as string}
            alt={headline}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: isPilot ? '50% 50%' : '50% 20%',
              display: 'block',
            }}
          />
        ) : (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(80% 70% at 50% 30%, var(--navy) 0%, var(--navy-dark) 55%, var(--navy-abyss) 100%)',
            }}
          />
        )}

        {episode.isNew && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              padding: '3px 8px',
              background: 'var(--brand-red)',
              color: '#fff',
              fontFamily: FBC,
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            New
          </span>
        )}
      </div>

      {/* NAVY PLATE — content-sized, never shrinks (fixes mobile text clipping) */}
      <div
        className="podcast-cover-plate"
        style={{
          flex: '0 0 auto',
          background: NAVY,
          color: WHITE,
          padding: '12px 12px 11px',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        <span aria-hidden="true" style={{ width: 24, height: 3, background: pillarHex, display: 'block' }} />

        <span
          style={{
            marginTop: 8,
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 'clamp(8px, 2.6vw, 10px)',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: pillarHex,
          }}
        >
          {kicker}
        </span>

        <span
          style={{
            marginTop: 4,
            fontFamily: FBN,
            fontSize: isPilot ? 'clamp(18px, 6.5vw, 26px)' : 'clamp(20px, 7vw, 30px)',
            lineHeight: 0.95,
            letterSpacing: '0.01em',
            color: WHITE,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {headline}
        </span>

        <span
          style={{
            marginTop: 6,
            fontFamily: FPI,
            fontStyle: 'italic',
            fontSize: 'clamp(11px, 3.2vw, 13px)',
            lineHeight: 1.25,
            color: WHITE_56,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </span>

        {metaLine && (
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${DIVIDER}` }}>
            <span
              style={{
                fontFamily: FBC,
                fontWeight: 600,
                fontSize: 'clamp(8px, 2.4vw, 10px)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: WHITE_56,
              }}
            >
              {metaLine}
            </span>
          </div>
        )}
      </div>

      <style>{`
        .podcast-cover-card--interactive { outline: none; transition: transform 200ms ease; }
        .podcast-cover-card--interactive:hover { transform: translateY(-4px); }
        .podcast-cover-card--interactive:focus-visible {
          outline: 2px solid var(--brand-teal);
          outline-offset: 2px;
        }
        @media (max-width: 600px) {
          .podcast-cover-plate {
            padding: 10px 10px 9px !important;
          }
        }
      `}</style>
    </CoverCardFrame>
  )
}
