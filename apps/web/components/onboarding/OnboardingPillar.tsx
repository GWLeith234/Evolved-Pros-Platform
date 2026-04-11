'use client'

import { useState } from 'react'

interface Props {
  onContinue: () => void
}

const PILLARS = [
  { number: 1, label: 'Foundation',       color: '#FFA538', description: 'Build the base everything else requires' },
  { number: 2, label: 'Identity',          color: '#A78BFA', description: 'Architect who you are on purpose' },
  { number: 3, label: 'Mental Toughness',  color: '#F87171', description: 'Build an unshakeable performance mindset' },
  { number: 4, label: 'Strategy',          color: '#60A5FA', description: 'Develop a WIG and execute with discipline' },
  { number: 5, label: 'Accountability',    color: '#C9A84C', description: 'Create systems that keep you on track' },
  { number: 6, label: 'Execution',         color: '#0ABFA3', description: 'Build daily habits that compound over time' },
]

export function OnboardingPillar({ onContinue }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleContinue() {
    setSaving(true)
    if (selected !== null) {
      await fetch('/api/onboarding/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focus_pillar: selected }),
      })
    }
    setSaving(false)
    onContinue()
  }

  const selectedPillar = PILLARS.find(p => p.number === selected)

  return (
    <div>
      {/* Heading */}
      <h2 style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: '26px', color: '#faf9f7', margin: '0 0 8px' }}>
        Where do you need the most work?
      </h2>
      <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: '13px', color: 'rgba(250,249,247,0.45)', lineHeight: 1.55, margin: '0 0 24px' }}>
        Pick your biggest growth area. You&apos;ll still start with Foundation — it&apos;s the base everything else builds on.
      </p>

      {/* Pillar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
        {PILLARS.map(pillar => {
          const isSelected = selected === pillar.number
          return (
            <button
              key={pillar.number}
              type="button"
              onClick={() => setSelected(pillar.number)}
              style={{
                position: 'relative',
                padding: '14px 12px',
                borderRadius: '8px',
                border: `2px solid ${isSelected ? pillar.color : 'rgba(255,255,255,0.07)'}`,
                backgroundColor: isSelected ? pillar.color : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              {/* Check mark */}
              {isSelected && (
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              )}
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isSelected ? 'white' : pillar.color, marginBottom: '8px' }} />
              <p style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 700,
                fontSize: '8px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                margin: '0 0 3px',
              }}>
                Pillar {pillar.number}
              </p>
              <p style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                color: isSelected ? 'white' : '#faf9f7',
                margin: '0 0 4px',
                lineHeight: 1.1,
              }}>
                {pillar.label}
              </p>
              <p style={{
                fontFamily: 'Barlow, sans-serif',
                fontSize: '11px',
                color: isSelected ? 'rgba(255,255,255,0.75)' : 'rgba(250,249,247,0.35)',
                margin: 0,
                lineHeight: 1.4,
              }}>
                {pillar.description}
              </p>
            </button>
          )
        })}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={saving || selected === null}
        style={{
          width: '100%',
          padding: '14px 24px',
          backgroundColor: selectedPillar?.color ?? '#C9A84C',
          color: '#0A0F18',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 900,
          fontSize: '14px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          border: 'none',
          borderRadius: '6px',
          cursor: saving || selected === null ? 'not-allowed' : 'pointer',
          opacity: saving || selected === null ? 0.45 : 1,
          transition: 'background-color 0.2s, opacity 0.15s',
        }}
      >
        {saving ? 'Saving…' : 'Start My Journey →'}
      </button>

      {/* Skip */}
      <button
        type="button"
        onClick={onContinue}
        style={{
          display: 'block',
          width: '100%',
          marginTop: '12px',
          padding: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: '11px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.2)',
          textAlign: 'center',
        }}
      >
        Not sure yet — skip
      </button>
    </div>
  )
}
