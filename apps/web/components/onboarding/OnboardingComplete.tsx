'use client'

import { useState } from 'react'

interface Props {
  displayName: string
}

const TEAL = '#0ABFA3'

// Land members in Foundation immediately — first lesson of first course.
const FIRST_COURSE_HREF = '/academy/foundation'

async function finish(destination: string) {
  await fetch('/api/onboarding/complete', { method: 'PATCH' })
  window.location.href = destination
}

export function OnboardingComplete({ displayName }: Props) {
  const [loading, setLoading] = useState<'academy' | 'community' | 'home' | 'scoreboard' | null>(null)

  async function handleAcademy() {
    setLoading('academy')
    await finish(FIRST_COURSE_HREF)
  }

  async function handleCommunity() {
    setLoading('community')
    await finish('/community')
  }

  async function handleHome() {
    setLoading('home')
    await finish('/home')
  }

  /** Scoreboard / Daily Pulse now lives on Home (Goals → Home consolidation). */
  async function handleScoreboard() {
    setLoading('scoreboard')
    await finish('/home')
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <style>{`
        @keyframes ob-pulse {
          0%   { transform: scale(1);    opacity: 0.6; }
          50%  { transform: scale(1.18); opacity: 0.15; }
          100% { transform: scale(1);    opacity: 0.6; }
        }
      `}</style>

      {/* Pulse ring + checkmark */}
      <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 28px' }}>
        {/* Animated ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `3px solid ${TEAL}`,
          animation: 'ob-pulse 2s ease-in-out infinite',
        }} />
        {/* Solid circle */}
        <div style={{
          position: 'absolute',
          inset: '8px',
          borderRadius: '50%',
          backgroundColor: `${TEAL}20`,
          border: `2px solid ${TEAL}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>

      {/* Heading */}
      <h2 style={{
        fontFamily: '"Arial Black", Arial, sans-serif',
        fontWeight: 900,
        fontSize: '36px',
        color: 'var(--media-ink)',
        margin: '0 0 12px',
        lineHeight: 1.0,
      }}>
        You&apos;re in.
      </h2>

      {/* Member name */}
      {displayName && (
        <p style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: '12px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: TEAL,
          margin: '0 0 12px',
        }}>
          Welcome, {displayName}
        </p>
      )}

      <p style={{
        fontFamily: 'Barlow, sans-serif',
        fontSize: '14px',
        color: 'var(--media-ink-soft)',
        lineHeight: 1.6,
        margin: '0 0 12px',
        maxWidth: '360px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        Six pillars. One daily pulse. Foundation is the base everything else builds on —
        open the scoreboard anytime to track streaks and goals.
      </p>
      <p style={{
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'rgba(201,168,76,0.85)',
        margin: '0 0 24px',
      }}>
        Foundation · Identity · Mental · Strategy · Accountability · Execution
      </p>

      {/* Primary — straight into Foundation */}
      <button
        type="button"
        onClick={handleAcademy}
        disabled={!!loading}
        style={{
          width: '100%',
          padding: '16px 24px',
          backgroundColor: '#C9302A',
          color: '#fff',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 900,
          fontSize: '15px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading && loading !== 'academy' ? 0.5 : 1,
          marginBottom: '10px',
        }}
      >
        {loading === 'academy' ? 'Loading…' : 'Start Foundation →'}
      </button>

      <button
        type="button"
        onClick={handleHome}
        disabled={!!loading}
        style={{
          width: '100%',
          padding: '14px 24px',
          backgroundColor: 'var(--media-cream-tint)',
          color: 'var(--media-ink)',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: '14px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          border: '1px solid var(--paper-line)',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading && loading !== 'home' ? 0.5 : 1,
          marginBottom: '8px',
        }}
      >
        {loading === 'home' ? 'Loading…' : 'Go to Home'}
      </button>

      <button
        type="button"
        onClick={handleScoreboard}
        disabled={!!loading}
        style={{
          width: '100%',
          padding: '14px 24px',
          backgroundColor: 'rgba(201,168,76,0.12)',
          color: '#C9A84C',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 800,
          fontSize: '13px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          border: '1px solid rgba(201,168,76,0.35)',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading && loading !== 'scoreboard' ? 0.5 : 1,
          marginBottom: '8px',
        }}
      >
        {loading === 'scoreboard' ? 'Loading…' : 'Open Scoreboard & Daily Pulse →'}
      </button>

      <button
        type="button"
        onClick={handleCommunity}
        disabled={!!loading}
        style={{
          width: '100%',
          padding: '12px 24px',
          background: 'none',
          color: 'var(--media-ink-soft)',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: '12px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading === 'community' ? 'Loading…' : 'Or join the community first'}
      </button>
    </div>
  )
}
