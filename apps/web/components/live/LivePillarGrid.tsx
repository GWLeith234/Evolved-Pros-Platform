'use client'

import { useState } from 'react'
import { PILLAR_TALKS, type PillarTalk } from '@/lib/live/pillar-talks'
import { LiveSectionHeader } from './LiveSectionHeader'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'
const FP = 'Playfair Display, Georgia, serif'

function PillarCard({ talk }: { talk: PillarTalk }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${hover ? talk.color : 'var(--border-soft2)'}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 200ms ease, border-color 200ms ease',
        transform: hover ? 'translateY(-3px)' : 'translateY(0)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '16 / 10',
          background: `#0A0F18 url(${talk.img}) center/cover no-repeat`,
          borderBottom: `3px solid ${talk.color}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,15,24,0.0) 35%, rgba(10,15,24,0.78) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            padding: '4px 9px',
            background: 'rgba(10,15,24,0.55)',
            border: `1px solid ${talk.color}`,
            fontFamily: FBN,
            fontSize: 13,
            letterSpacing: '0.18em',
            color: talk.color,
          }}
        >
          {talk.num}
        </div>
        <p
          style={{
            position: 'absolute',
            bottom: 14,
            left: 16,
            right: 16,
            margin: 0,
            fontFamily: FBN,
            fontSize: 26,
            letterSpacing: '0.06em',
            color: '#fff',
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          {talk.tag.toUpperCase()}
        </p>
      </div>
      <div style={{ padding: '22px 22px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--text-3)',
          }}
        >
          {talk.format}
        </p>
        <h4
          style={{
            margin: '8px 0 10px',
            fontFamily: FP,
            fontWeight: 700,
            fontSize: 22,
            lineHeight: 1.2,
            color: 'var(--text-strong)',
            textWrap: 'pretty',
          }}
        >
          {talk.title}
        </h4>
        <p style={{ margin: 0, fontFamily: FB, fontSize: 14, lineHeight: 1.55, color: 'var(--text-2)' }}>{talk.blurb}</p>
      </div>
    </div>
  )
}

export function LivePillarGrid() {
  return (
    <section style={{ maxWidth: 1280, margin: '72px auto 0', padding: '0 24px' }}>
      <LiveSectionHeader
        eyebrow="The Six Pillars"
        title="What George speaks on"
        kicker="Pick one as a keynote. Combine two or three for a half-day workshop. All six for the full EVOLVED Architecture™ mainstage."
      />
      <div className="live-pillar-grid" style={{ marginTop: 28 }}>
        {PILLAR_TALKS.map(talk => (
          <PillarCard key={talk.num} talk={talk} />
        ))}
      </div>
    </section>
  )
}
