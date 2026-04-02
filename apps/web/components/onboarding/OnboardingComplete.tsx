'use client'

import { useState } from 'react'

interface Props {
  displayName: string
}

const TEAL = '#0ABFA3'

async function finish(destination: string) {
  await fetch('/api/onboarding/complete', { method: 'PATCH' })
  window.location.href = destination
}

export function OnboardingComplete({ displayName }: Props) {
  const [loading, setLoading] = useState<'academy' | 'community' | null>(null)

  async function handleAcademy() {
    setLoading('academy')
    await finish('/academy')
  }

  async function handleCommunity() {
    setLoading('community')
    await finish('/community')
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
        color: '#ffffff',
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
          fontSize: '11px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: TEAL,
          margin: '0 0 12px',
        }}>
          Welcome, {displayName}
        </p>
      )}

      {/* Subtext */}
      <p style={{
        fontFamily: 'Barlow, sans-serif',
        fontSize: '14px',
        color: 'rgba(250,249,247,0.5)',
        lineHeight: 1.6,
        margin: '0 0 36px',
        maxWidth: '340px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        Welcome to Evolved Pros. Your journey to becoming an elite sales professional starts now.
      </p>

      {/* Primary CTA — Academy */}
      <button
        type="button"
        onClick={handleAcademy}
        disabled={!!loading}
        style={{
          width: '100%',
          padding: '16px 24px',
          backgroundColor: '#C9A84C',
          color: '#0A0F18',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 900,
          fontSize: '15px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading === 'community' ? 0.5 : 1,
          marginBottom: '10px',
        }}
      >
        {loading === 'academy' ? 'Loading…' : 'Start Academy →'}
      </button>

      {/* Secondary CTA — Community */}
      <button
        type="button"
        onClick={handleCommunity}
        disabled={!!loading}
        style={{
          width: '100%',
          padding: '14px 24px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.7)',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: '14px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading === 'academy' ? 0.5 : 1,
        }}
      >
        {loading === 'community' ? 'Loading…' : 'Go to Community'}
      </button>
    </div>
  )
}
