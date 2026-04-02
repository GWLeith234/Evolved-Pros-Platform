'use client'

import Link from 'next/link'

const BLUE   = '#60A5FA'
const PURPLE = '#A78BFA'
const GOLD   = '#C9A84C'
const RED    = '#ef0e30'

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
  scoreboard: { wigStatement: string | null; lead1Label: string | null; lead1Target: number | null } | null
  nextEvent: { title: string; startsAt: string } | null
  userRank: number | null
  nextRankEntry: { displayName: string; points: number } | null
  userPoints: number
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
  minWidth: '152px',
  maxWidth: '200px',
  flex: '0 0 auto',
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

export function DashboardStrip({ pillarProgress, episode, scoreboard, nextEvent, userRank, nextRankEntry, userPoints }: DashboardStripProps) {
  const myPoints = userPoints
  const ahead = nextRankEntry && nextRankEntry.points > myPoints ? nextRankEntry : null
  const behind = nextRankEntry && nextRankEntry.points <= myPoints ? nextRankEntry : null

  return (
    <div
      style={{
        backgroundColor: '#111926',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '10px 16px',
        overflowX: 'auto',
        overflowY: 'hidden',
        msOverflowStyle: 'none',
      }}
    >
      <style>{`.ep-strip::-webkit-scrollbar { display: none; }`}</style>
      <div className="ep-strip" style={{ display: 'flex', gap: '10px', width: 'max-content', overflowX: 'auto', scrollbarWidth: 'none' }}>

        {/* Card 1 — Academy */}
        <Link
          href="/academy"
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
          <p style={{ ...CTA_STYLE, color: BLUE }}>Resume →</p>
        </Link>

        {/* Card 2 — Podcast */}
        {episode && (
          <Link
            href="/podcast"
            style={{ ...CARD_BASE, background: 'linear-gradient(135deg, #1a1228, #110d1e)', border: '1px solid rgba(167,139,250,.25)' }}
          >
            <p style={{ ...LABEL_STYLE, color: PURPLE }}>🎙 Just Dropped</p>
            <p style={HEADLINE_STYLE}>{episode.title}</p>
            <p style={SUB_STYLE}>
              {[episode.guestName, formatDuration(episode.durationSeconds)].filter(Boolean).join(' · ')}
            </p>
            <p style={{ ...CTA_STYLE, color: PURPLE }}>▶ Watch now →</p>
          </Link>
        )}

        {/* Card 3 — Scoreboard */}
        <Link
          href="/academy/accountability"
          style={{ ...CARD_BASE, background: 'linear-gradient(135deg, #1e1a08, #160f00)', border: '1px solid rgba(201,168,76,.3)' }}
        >
          <p style={{ ...LABEL_STYLE, color: GOLD }}>📊 Scoreboard</p>
          {scoreboard?.wigStatement ? (
            <>
              <p style={HEADLINE_STYLE}>{scoreboard.lead1Label ?? 'Lead measure'}</p>
              <p style={SUB_STYLE}>Target: {scoreboard.lead1Target ?? '—'}/wk</p>
              <p style={{ ...CTA_STYLE, color: GOLD }}>Log calls →</p>
            </>
          ) : (
            <>
              <p style={HEADLINE_STYLE}>Track your WIG</p>
              <p style={SUB_STYLE}>No scoreboard set up yet</p>
              <p style={{ ...CTA_STYLE, color: GOLD }}>Set up Scoreboard →</p>
            </>
          )}
        </Link>

        {/* Card 4 — Events (conditional) */}
        {nextEvent && (
          <Link
            href="/events"
            style={{ ...CARD_BASE, background: 'linear-gradient(135deg, #200a0a, #180606)', border: '1px solid rgba(201,48,42,.3)' }}
          >
            <p style={{ ...LABEL_STYLE, color: RED }}>📅 Upcoming</p>
            <p style={HEADLINE_STYLE}>{nextEvent.title}</p>
            <p style={SUB_STYLE}>{formatEventDate(nextEvent.startsAt)}</p>
            <p style={{ ...CTA_STYLE, color: RED }}>Register now →</p>
          </Link>
        )}

        {/* Card 5 — Leaderboard */}
        <Link
          href="/community"
          style={{ ...CARD_BASE, background: 'linear-gradient(135deg, #120d1e, #0d0a16)', border: '1px solid rgba(167,139,250,.2)' }}
        >
          <p style={{ ...LABEL_STYLE, color: PURPLE }}>🏆 Leaderboard</p>
          <p style={HEADLINE_STYLE}>
            {userRank ? `You&apos;re #${userRank}` : 'Earn points'}
          </p>
          <p style={SUB_STYLE}>
            {myPoints.toLocaleString()} pts
            {ahead && ` · ${ahead.displayName} is ${(ahead.points - myPoints).toLocaleString()} ahead`}
            {behind && !ahead && ` · ${behind.displayName} is ${(myPoints - behind.points).toLocaleString()} behind`}
          </p>
          <p style={{ ...CTA_STYLE, color: PURPLE }}>
            {ahead ? 'Close the gap →' : 'Stay ahead →'}
          </p>
        </Link>

      </div>
    </div>
  )
}
