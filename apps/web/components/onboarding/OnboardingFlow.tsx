'use client'

import { useState, useCallback, useEffect } from 'react'
import { OnboardingWelcome } from './OnboardingWelcome'
import { OnboardingProfile } from './OnboardingProfile'
import { OnboardingPillar } from './OnboardingPillar'
import { OnboardingPost } from './OnboardingPost'
import { OnboardingComplete } from './OnboardingComplete'
import { ConfettiBlast } from '@/components/ui/ConfettiBlast'

interface Props {
  initialStep: number
  userId: string
  displayName: string
  company: string
}

const TOTAL_STEPS = 5

const STEP_CELEBRATIONS: Record<number, { colors: string[]; message: string }> = {
  2: { colors: ['#C9A84C', '#fff', '#C9A84C'], message: 'You\u2019re already showing up.' },
  // Step 3 colors are dynamic (pillar color) — handled inline
  4: { colors: ['#0ABFA3', '#fff', '#0ABFA3'], message: 'The community sees you.' },
}

const ALL_PILLAR_COLORS = ['#FFA538', '#A78BFA', '#F87171', '#60A5FA', '#C9A84C', '#0ABFA3']

export function OnboardingFlow({ initialStep, userId, displayName, company }: Props) {
  const [currentStep, setCurrentStep] = useState(Math.max(1, Math.min(initialStep, TOTAL_STEPS)))
  const [celebrating, setCelebrating] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState('')
  const [celebrationColors, setCelebrationColors] = useState<string[]>([])
  const [pillarColor, setPillarColor] = useState('#60A5FA')

  async function saveStep(step: number) {
    await fetch('/api/onboarding/step', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    })
  }

  // Skip — no celebration, advance immediately
  async function skip() {
    const next = currentStep + 1
    if (next > TOTAL_STEPS) return
    await saveStep(next)
    setCurrentStep(next)
  }

  // Complete — show celebration, then advance after delay
  const advance = useCallback(async () => {
    const next = currentStep + 1
    if (next > TOTAL_STEPS) return

    // Check for celebration config
    const config = STEP_CELEBRATIONS[currentStep]
    if (config) {
      const colors = currentStep === 3 ? [pillarColor, '#fff', pillarColor] : config.colors
      const message = currentStep === 3 ? 'Your journey is set.' : config.message
      setCelebrationColors(colors)
      setCelebrationMessage(message)
      setCelebrating(true)
      await saveStep(next)
      setTimeout(() => {
        setCelebrating(false)
        setCelebrationMessage('')
        setCurrentStep(next)
      }, 1500)
    } else {
      await saveStep(next)
      setCurrentStep(next)
    }
  }, [currentStep, pillarColor])

  // Fire full confetti on final step
  useEffect(() => {
    if (currentStep === 5) {
      setCelebrationColors(ALL_PILLAR_COLORS)
      setCelebrating(true)
      setTimeout(() => setCelebrating(false), 2500)
    }
  }, [currentStep])

  // Pillar step reports its color
  function handlePillarContinue(color?: string) {
    if (color) setPillarColor(color)
    advance()
  }

  return (
    <div style={{ width: '100%', maxWidth: '480px' }}>
      {/* Confetti overlay */}
      <ConfettiBlast
        active={celebrating}
        colors={celebrationColors}
        count={currentStep === 5 ? 50 : 30}
      />

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
          fontSize: '12px',
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
          position: 'relative',
        }}
      >
        {/* Celebration message overlay */}
        {celebrationMessage && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              backgroundColor: 'rgba(17,25,38,0.95)',
              zIndex: 10,
              animation: 'celebMsgFade 300ms ease both',
            }}
          >
            <p
              style={{
                fontFamily: 'Barlow, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                color: celebrationColors[0] ?? '#C9A84C',
                textAlign: 'center',
              }}
            >
              {celebrationMessage}
            </p>
          </div>
        )}

        {currentStep === 1 && <OnboardingWelcome displayName={displayName} onContinue={advance} />}
        {currentStep === 2 && <OnboardingProfile userId={userId} onContinue={advance} />}
        {currentStep === 3 && <OnboardingPillar onContinue={handlePillarContinue} />}
        {currentStep === 4 && <OnboardingPost displayName={displayName} company={company} onContinue={advance} />}
        {currentStep === 5 && <OnboardingComplete displayName={displayName} />}
      </div>

      {/* Skip link (not on last step or pillar step) */}
      {currentStep < TOTAL_STEPS && currentStep !== 3 && !celebrating && (
        <button
          type="button"
          onClick={skip}
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

      <style>{`
        @keyframes celebMsgFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
