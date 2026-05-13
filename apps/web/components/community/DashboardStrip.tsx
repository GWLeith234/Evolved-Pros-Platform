'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const BLUE   = '#60A5FA'
const PURPLE = '#A78BFA'
const RED    = '#ef0e30'
const CTA    = '#0ABFA3'

// timeZone: 'UTC' pins the rendered day so SSR (Node, typically UTC) and the
// client (user's locale TZ) produce identical strings — hydration-stable.
function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`
}

export interface DashboardStripProps {
  pillarProgress: { pillar: string; label: string; pct: number } | null
  episode: { title: string; guestName: string | null; durationSeconds: number | null } | null
  nextEvent: { title: string; startsAt: string } | null
  userRank: number | null
  nextRankEntry: { displayName: string; points: number } | null
  userPoints: number
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '5px 0' }}>
      <div style={{ height: '3px', width: `${Math.min(Math.max(pct, 0), 100)}%`, backgroundColor: color, borderRadius: '2px', transition: 'width 0.3s' }} />
    </div>
  )
}

const CARD_BASE: React.CSSProperties = {
  display: 'block',
  borderRadius: '10px',
  padding: '12px 14px',
  textDecoration: 'none',
  cursor: 'pointer',
}

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  marginBottom: '4px',
  lineHeight: 1.2,
}

const HEADLINE_STYLE: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: '13px',
  color: 'white',
  lineHeight: 1.25,
  marginBottom: '2px',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const SUB_STYLE: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontSize: '11px',
  color: 'rgba(255,255,255,0.45)',
  lineHeight: 1.3,
  marginBottom: '4px',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const CTA_STYLE: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: '11px',
  marginTop: '4px',
  lineHeight: 1,
}

export function DashboardStrip({ pillarProgress, episode, nextEvent, userRank, nextRankEntry, userPoints }: DashboardStripProps) {
  const myPoints = userPoints
  const ahead = nextRankEntry && nextRankEntry.points > myPoints ? nextRankEntry : null
  const behind = nextRankEntry && nextRankEntry.points <= myPoints ? nextRankEntry : null

  return (
    <div
      style={{
        backgroundColor: '#111926',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '10px 16px',
      }}
    >
      <style>{`
        .ep-strip::-webkit-scrollbar { display: none; }
        .ep-strip {
          display: flex;
          flex-wrap: nowrap;
          gap: 12px;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .ep-strip-card {
          flex: 0 0 auto;
          flex-shrink: 0;
          width: 80vw;
          scroll-snap-align: start;
        }
        @media (min-width: 768px) {
          .ep-strip {
            gap: 10px;
            width: max-content;
            scroll-snap-type: none;
          }
          .ep-strip-card {
            width: auto;
            min-width: 152px;
            max-width: 200px;
            scroll-snap-align: none;
          }
        }
      `}</style>
      <div className="ep-strip">

        {/* Card 1 — Academy */}
        <Link
          href="/academy"
          className="ep-strip-card"
          style={{ ...CARD_BASE, background: 'linear-gradient(135deg, #0d1e38, #0a1528)', border: '1px solid rgba(96,165,250,.25)' }}
        >
          <p style={{ ...LABEL_STYLE, color: BLUE }}>📚 Academy</p>
          <p style={HEADLINE_STYLE}>
            {pillarProgress ? `Finish ${pillarProgress.label}` : 'Start Academy'}
          </p>
          {pillarProgress ? (
            <>
              <p style={SUB_STYLE}>You&apos;re {pillarProgress.pct}% through</p>
              <ProgressBar pct={pillarProgress.pct} color={BLUE} />
            </>
          ) : (
            <p style={SUB_STYLE}>Begin your first pillar</p>
          )}
          <p style={{ ...CTA_STYLE, color: CTA }}>{pillarProgress ? 'Resume →' : 'Start →'}</p>
        </Link>

        {/* Card 2 — Podcast */}
        {episode && (
          <Link
            href="/podcast"
            className="ep-strip-card"
            style={{ ...CARD_BASE, background: 'linear-gradient(135deg, #1a1228, #110d1e)', border: '1px solid rgba(167,139,250,.25)' }}
          >
            <p style={{ ...LABEL_STYLE, color: PURPLE }}>🎙 Just Dropped</p>
            <p style={HEADLINE_STYLE}>{episode.title}</p>
            <p style={SUB_STYLE}>
              {[episode.guestName, formatDuration(episode.durationSeconds)].filter(Boolean).join(' · ')}
            </p>
            <p style={{ ...CTA_STYLE, color: CTA }}>▶ Watch now →</p>
          </Link>
        )}

        {/* Card 4 — Events (conditional). Time-sensitive label/CTA are
            mount-deferred to keep SSR HTML stable; see EventCard below. */}
        {nextEvent && <EventCard startsAt={nextEvent.startsAt} title={nextEvent.title} />}

        {/* Card 5 — Leaderboard */}
        <Link
          href="/community"
          className="ep-strip-card"
          style={{ ...CARD_BASE, background: 'linear-gradient(135deg, #120d1e, #0d0a16)', border: '1px solid rgba(167,139,250,.2)' }}
        >
          <p style={{ ...LABEL_STYLE, color: PURPLE }}>🏆 Leaderboard</p>
          <p style={HEADLINE_STYLE}>
            {userRank ? `You're #${userRank}` : 'Earn points'}
          </p>
          <p style={SUB_STYLE}>
            {myPoints.toLocaleString()} pts
            {ahead && ` · ${ahead.displayName} is ${(ahead.points - myPoints).toLocaleString()} ahead`}
            {behind && !ahead && ` · ${behind.displayName} is ${(myPoints - behind.points).toLocaleString()} behind`}
          </p>
          <p style={{ ...CTA_STYLE, color: CTA }}>
            {ahead ? 'Close the gap →' : 'Stay ahead →'}
          </p>
        </Link>

      </div>
    </div>
  )
}

// daysUntil() reads Date.now() which differs between SSR write and client
// hydrate — for an event close to a day boundary the result can shift,
// producing different evtLabel / evtCta text and triggering React #425.
// Defer the derived strings to a post-mount render (same pattern as
// ClientTimeAgo in PostCard) so the first paint is identical SSR vs CSR.
function EventCard({ startsAt, title }: { startsAt: string; title: string }) {
  const [derived, setDerived] = useState<{ label: string; cta: string } | null>(null)

  useEffect(() => {
    const days = daysUntil(startsAt)
    let label: string
    let cta: string
    if (days <= 0)      { label = '🔴 Today';                cta = 'Register now →' }
    else if (days === 1){ label = '🔴 Tomorrow';             cta = 'Register now →' }
    else if (days <= 3) { label = `🔴 ${days} days away`;    cta = 'Register now →' }
    else if (days <= 7) { label = '📅 This week';            cta = 'Register →' }
    else                { label = '📅 Upcoming';             cta = 'View →' }
    setDerived({ label, cta })
  }, [startsAt])

  // First paint (SSR + initial client render) shows the stable, time-agnostic
  // bucket so SSR HTML and the hydrate match exactly.
  const label = derived?.label ?? '📅 Upcoming'
  const cta   = derived?.cta   ?? 'View →'

  return (
    <Link
      href="/events"
      className="ep-strip-card"
      style={{ ...CARD_BASE, background: 'linear-gradient(135deg, #200a0a, #180606)', border: '1px solid rgba(201,48,42,.3)' }}
    >
      <p style={{ ...LABEL_STYLE, color: RED }}>{label}</p>
      <p style={HEADLINE_STYLE}>{title}</p>
      <p style={SUB_STYLE}>{formatEventDate(startsAt)}</p>
      <p style={{ ...CTA_STYLE, color: CTA }}>{cta}</p>
    </Link>
  )
}
