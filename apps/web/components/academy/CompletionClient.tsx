'use client'

import { useState } from 'react'
import Link from 'next/link'

const GOLD = '#C9A84C'
const TEAL = '#0ABFA3'

const LINKEDIN_POST = `I just completed The Evolved Architecture™ — a 6-pillar professional development framework by George Leith.

Foundation → Identity → Mental Toughness → Strategic Approach → Accountability → Execution.

If you're in sales and want to build an unshakeable foundation for high performance, check out Evolved Pros.

#EvolvedPros #SalesProfessional #PersonalDevelopment`

const TWEET_TEXT = encodeURIComponent(
  "I just completed The Evolved Architecture™ — all 6 pillars. Foundation → Identity → Mental Toughness → Strategic Approach → Accountability → Execution. #EvolvedPros #SalesProfessional"
)

interface PillarBadge {
  number: number
  label: string
  color: string
  earned: boolean
}

interface Props {
  displayName: string
  completedAt: string
  alumniAwardedAt: string
  pillarBadges: PillarBadge[]
}

function PulseRing() {
  return (
    <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 32px' }}>
      <style>{`
        @keyframes ep-pulse { 0%,100% { transform: scale(1); opacity: 0.4; } 50% { transform: scale(1.18); opacity: 0.1; } }
      `}</style>
      {/* Pulse rings */}
      <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: `2px solid ${TEAL}`, animation: 'ep-pulse 2s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: -24, borderRadius: '50%', border: `1px solid ${TEAL}`, animation: 'ep-pulse 2s ease-in-out 0.4s infinite', pointerEvents: 'none' }} />
      {/* Circle */}
      <div style={{ width: 100, height: 100, borderRadius: '50%', backgroundColor: `${TEAL}12`, border: `2px solid ${TEAL}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <path d="M8 22L18 33L36 12" stroke={TEAL} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

export function CompletionClient({ displayName, completedAt, alumniAwardedAt, pillarBadges }: Props) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(LINKEDIN_POST).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div style={{ backgroundColor: '#0A0F18', minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <PulseRing />
          <h1 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700, fontSize: 'clamp(40px, 7vw, 64px)', color: GOLD, margin: '0 0 12px', letterSpacing: '0.04em', lineHeight: 1 }}>
            EVOLVED
          </h1>
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 20, color: 'white', margin: '0 0 8px', letterSpacing: '0.04em' }}>
            You have completed The Evolved Architecture™
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, margin: '0 0 20px' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{displayName}</span>
            &nbsp;·&nbsp;{completedAt}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.65, maxWidth: 480, margin: '0 auto' }}>
            You are now part of a small group of sales professionals who have done the work.
          </p>
        </div>

        {/* 6 Pillar badges */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 16 }}>
            All 6 Pillars Complete
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {pillarBadges.map(b => (
              <div
                key={b.number}
                style={{ backgroundColor: '#111926', border: `1px solid ${b.earned ? b.color + '40' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, padding: '14px 12px', textAlign: 'center' }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: `2px solid ${b.earned ? b.color : 'rgba(255,255,255,0.1)'}`, backgroundColor: b.earned ? `${b.color}12` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  <span style={{ fontSize: 16, opacity: b.earned ? 1 : 0.3 }}>
                    {['🧱','🪞','🧠','🎯','📊','⚡'][b.number - 1]}
                  </span>
                </div>
                <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '11px', color: b.earned ? 'white' : 'rgba(255,255,255,0.25)', margin: '0 0 2px', letterSpacing: '0.04em' }}>
                  {b.label}
                </p>
                <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: b.earned ? b.color : 'rgba(255,255,255,0.15)', margin: 0 }}>
                  {b.earned ? 'Complete' : 'Pending'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Alumni badge — featured */}
        <div style={{ backgroundColor: '#111926', border: `2px solid ${GOLD}40`, borderRadius: 12, padding: '28px 32px', textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', border: `2px solid ${GOLD}`, backgroundColor: `${GOLD}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ fontSize: 28 }}>★</span>
          </div>
          <p style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700, fontSize: 28, color: GOLD, margin: '0 0 4px', letterSpacing: '0.08em' }}>
            EVOLVED
          </p>
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', margin: '0 0 12px' }}>
            ALUMNI
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0 }}>
            Awarded {alumniAwardedAt}
          </p>
        </div>

        {/* Share section */}
        <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '28px 32px', marginBottom: 40 }}>
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'white', margin: '0 0 16px' }}>
            Share your achievement
          </p>
          <pre style={{ backgroundColor: '#0d1520', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '14px 16px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: '0 0 16px', fontFamily: 'inherit' }}>
            {LINKEDIN_POST}
          </pre>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCopy}
              style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', backgroundColor: copied ? TEAL : '#0d6b91', color: 'white', border: 'none', borderRadius: 4, padding: '10px 20px', cursor: 'pointer', transition: 'background-color 0.2s' }}
            >
              {copied ? '✓ Copied!' : 'Copy for LinkedIn'}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?text=${TWEET_TEXT}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', borderRadius: 4, padding: '10px 20px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              Share on X →
            </a>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/academy"
            style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', backgroundColor: TEAL, color: '#0A0F18', borderRadius: 6, padding: '13px 28px', textDecoration: 'none' }}
          >
            Go to Academy →
          </Link>
          <Link
            href="/profile/me"
            style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: '13px 28px', textDecoration: 'none' }}
          >
            View Profile →
          </Link>
        </div>

      </div>
    </div>
  )
}
