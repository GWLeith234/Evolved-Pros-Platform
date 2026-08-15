'use client'

import { useRouter } from 'next/navigation'
import type { PodcastEpisode, PodcastPillar } from '@/lib/podcast/transforms'
import { PILLAR_META, displayEpisodeTitle } from '@/lib/podcast/transforms'

// SPRINT B — the 9:16 cover card. This is a constant "physical" object: a cream
// sleeve with a navy plate. Its colours DO NOT flip with the app theme (only the
// surrounding page chrome does). SPRINT C moved those literals into FIXED
// structural tokens in globals.css — defined in :root only and never redefined
// under html.light-mode / cream-mode — so the card carries zero raw hex while
// staying theme-invariant. Do not swap --pod-cream for the identical-looking
// --ed-cream: that one IS theme-scoped.
const CREAM = 'var(--pod-cream)'
const NAVY = 'var(--pod-navy)'
const WHITE = 'var(--white)'
const WHITE_56 = 'rgba(255,255,255,0.56)'
const DIVIDER = 'rgba(255,255,255,0.16)'

const FBN = 'var(--font-bebas)'
const FBC = 'var(--font-barlow-condensed)'
const FPI = 'var(--font-display)' // Playfair Display

// Pillar accents for this card (SPRINT B spec). These reuse the existing
// --pillar-1..6 tokens — byte-identical values to the Sprint B literals, and
// already theme-invariant — rather than minting card-scoped duplicates.
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

export function PodcastCoverCard({ episode, interactive = true }: PodcastCoverCardProps) {
  const router = useRouter()

  const guestName = episode.guest.name?.trim() || ''
  // The pilot (and any guestless episode) gets the typographic fallback — no
  // portrait, plate expanded, podcast name where the guest name would be.
  const isPilot = !guestName
  // Only ever render <img> when there is a real art URL — never a broken image.
  const artUrl = episode.guest.photo
  const showArt = !isPilot && !!artUrl

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

  // The art region carries a fixed square-ish aspect that equals the top ~62%
  // of a 9:16 card at the design width; the navy plate then sizes to its own
  // content below it. This keeps the card at 9:16 at typical widths while
  // GUARANTEEING the plate text never clips at narrow/mobile widths (it grows a
  // little instead). The pilot uses a short cream field so the plate expands.
  const artAspect = isPilot ? '1 / 0.62' : '1 / 1.1'

  const navigate = () => interactive && router.push(`/podcast/${episode.slug}`)

  return (
    <article
      className={interactive ? 'podcast-cover-card podcast-cover-card--interactive' : 'podcast-cover-card'}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? navigate : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate()
              }
            }
          : undefined
      }
      aria-label={interactive ? `Watch ${headline}: ${title}` : undefined}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '9 / 16',
        background: CREAM,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: interactive ? 'pointer' : 'default',
      }}
    >
      {/* ART REGION — square-ish top (~62% of a 9:16 card); cream field on the pilot */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: artAspect,
          flex: '0 0 auto',
          background: CREAM,
          overflow: 'hidden',
        }}
      >
        {showArt && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artUrl as string}
            alt={headline}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: '50% 20%',
              display: 'block',
            }}
          />
        )}
      </div>

      {/* NAVY PLATE — bottom, sized to content so text never clips */}
      <div
        style={{
          flex: '1 1 auto',
          background: NAVY,
          color: WHITE,
          padding: '16px 16px 15px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 28×3 pillar rule */}
        <span aria-hidden="true" style={{ width: 28, height: 3, background: pillarHex, display: 'block' }} />

        {/* Kicker */}
        <span
          style={{
            marginTop: 10,
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: pillarHex,
          }}
        >
          {kicker}
        </span>

        {/* Headline — guest name (or podcast name for the pilot) */}
        <span
          style={{
            marginTop: 6,
            fontFamily: FBN,
            fontSize: isPilot ? 26 : 31,
            lineHeight: 0.93,
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

        {/* Episode title — Playfair italic, 3-line clamp, white 56% */}
        <span
          style={{
            marginTop: 8,
            fontFamily: FPI,
            fontStyle: 'italic',
            fontSize: 13,
            lineHeight: 1.3,
            color: WHITE_56,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </span>

        {/* Divider + date · duration */}
        {metaLine && (
          <div style={{ marginTop: 'auto', paddingTop: 12 }}>
            <span style={{ display: 'block', height: 1, background: DIVIDER, marginBottom: 10 }} aria-hidden="true" />
            <span
              style={{
                fontFamily: FBC,
                fontWeight: 600,
                fontSize: 10,
                letterSpacing: '0.14em',
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
      `}</style>
    </article>
  )
}
