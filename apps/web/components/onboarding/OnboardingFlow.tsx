'use client'

import { useState } from 'react'
import { OnboardingWelcome } from './OnboardingWelcome'
import { OnboardingProfile } from './OnboardingProfile'
import { OnboardingPillar } from './OnboardingPillar'

interface Props {
  initialStep: number
  userId: string
}

const TOTAL_STEPS = 5

const STEP_LABELS: Record<number, string> = {
  1: 'Welcome',
  2: 'Your Profile',
  3: 'Your Focus',
  4: 'Say Hello',
  5: 'You\'re Set',
}

function StepPlaceholder({ stepNumber, label, onContinue }: { stepNumber: number; label: string; onContinue: () => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: '10px',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: '#C9A84C',
          margin: '0 0 12px',
        }}
      >
        Step {stepNumber} — {label}
      </p>
      <h2
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 900,
          fontSize: '28px',
          color: '#faf9f7',
          margin: '0 0 12px',
        }}
      >
        Coming soon
      </h2>
      <p
        style={{
          fontFamily: 'Barlow, sans-serif',
          fontSize: '14px',
          color: 'rgba(250,249,247,0.45)',
          margin: '0 0 36px',
        }}
      >
        This step will be fully built in the next sprint.
      </p>
      <button
        type="button"
        onClick={onContinue}
        style={{
          width: '100%',
          padding: '14px 24px',
          backgroundColor: '#C9A84C',
          color: '#0A0F18',
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 900,
          fontSize: '14px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
        }}
      >
        Continue →
      </button>
    </div>
  )
}

export function OnboardingFlow({ initialStep, userId }: Props) {
  const [currentStep, setCurrentStep] = useState(Math.max(1, Math.min(initialStep, TOTAL_STEPS)))
  const [completing, setCompleting] = useState(false)

  async function saveStep(step: number) {
    await fetch('/api/onboarding/step', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    })
  }

  async function advance() {
    const next = currentStep + 1
    if (next > TOTAL_STEPS) {
      await completeOnboarding()
      return
    }
    await saveStep(next)
    setCurrentStep(next)
  }

  async function completeOnboarding() {
    setCompleting(true)
    await fetch('/api/onboarding/complete', { method: 'PATCH' })
    window.location.href = '/home'
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
        {currentStep === 4 && (
          <StepPlaceholder stepNumber={4} label={STEP_LABELS[4]} onContinue={advance} />
        )}
        {currentStep === 5 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#0ABFA3', margin: '0 0 12px' }}>
              All Done
            </p>
            <h2 style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: '32px', color: '#faf9f7', margin: '0 0 12px' }}>
              You&apos;re all set.
            </h2>
            <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: '14px', color: 'rgba(250,249,247,0.45)', margin: '0 0 36px' }}>
              Your journey starts now.
            </p>
            <button
              type="button"
              onClick={completeOnboarding}
              disabled={completing}
              style={{
                width: '100%',
                padding: '16px 24px',
                backgroundColor: '#0ABFA3',
                color: '#0A0F18',
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 900,
                fontSize: '15px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                border: 'none',
                borderRadius: '6px',
                cursor: completing ? 'not-allowed' : 'pointer',
                opacity: completing ? 0.6 : 1,
              }}
            >
              {completing ? 'Loading…' : 'Enter Evolved Pros →'}
            </button>
          </div>
        )}
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
