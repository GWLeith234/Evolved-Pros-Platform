'use client'

import { useState } from 'react'
import { OnboardingWelcome } from './OnboardingWelcome'
import { OnboardingProfile } from './OnboardingProfile'
import { OnboardingPillar } from './OnboardingPillar'
import { OnboardingPost } from './OnboardingPost'
import { OnboardingComplete } from './OnboardingComplete'

interface Props {
  initialStep: number
  userId: string
  displayName: string
  company: string
}

const TOTAL_STEPS = 5


export function OnboardingFlow({ initialStep, userId, displayName, company }: Props) {
  const [currentStep, setCurrentStep] = useState(Math.max(1, Math.min(initialStep, TOTAL_STEPS)))

  async function saveStep(step: number) {
    await fetch('/api/onboarding/step', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    })
  }

  async function advance() {
    const next = currentStep + 1
    if (next > TOTAL_STEPS) return // step 5 handles its own completion
    await saveStep(next)
    setCurrentStep(next)
  }

  return (
    <div style={{ width: '100%', maxWidth: '480px' }}>
      {/* Progress indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '10px',
        }}
      >
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
          <div
            key={s}
            style={{
              width: s === currentStep ? 24 : 8,
              height: 8,
              borderRadius: '4px',
              backgroundColor:
                s < currentStep ? '#0ABFA3' :
                s === currentStep ? '#C9A84C' :
                'rgba(255,255,255,0.12)',
              transition: 'all 0.25s ease',
              flexShrink: 0,
            }}
          />
        ))}
      </div>
      <p
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          textAlign: 'center',
          margin: '0 0 28px',
        }}
      >
        Step {currentStep} of {TOTAL_STEPS}
      </p>

      {/* Card */}
      <div
        style={{
          backgroundColor: '#111926',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
          padding: '36px 32px',
        }}
      >
        {currentStep === 1 && <OnboardingWelcome onContinue={advance} />}
        {currentStep === 2 && <OnboardingProfile userId={userId} onContinue={advance} />}
        {currentStep === 3 && <OnboardingPillar onContinue={advance} />}
        {currentStep === 4 && <OnboardingPost displayName={displayName} company={company} onContinue={advance} />}
        {currentStep === 5 && <OnboardingComplete displayName={displayName} />}
      </div>

      {/* Skip link (not on last step) */}
      {currentStep < TOTAL_STEPS && (
        <button
          type="button"
          onClick={advance}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '16px',
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontSize: '12px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.2)',
          }}
        >
          Skip for now
        </button>
      )}
    </div>
  )
}
