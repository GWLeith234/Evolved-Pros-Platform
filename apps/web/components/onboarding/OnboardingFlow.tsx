'use client'

/**
 * Streamlined onboarding — 3 steps to first value (Foundation course):
 *  1. Welcome
 *  2. Quick profile
 *  3. Focus pillar (still starts Foundation)
 *  4. Complete → primary CTA into first course
 *
 * Community post step removed to cut time-to-academy.
 */

import { useState, useCallback, useEffect } from 'react'
import { OnboardingWelcome } from './OnboardingWelcome'
import { OnboardingProfile } from './OnboardingProfile'
import { OnboardingPillar } from './OnboardingPillar'
import { OnboardingComplete } from './OnboardingComplete'
import { ConfettiBlast } from '@/components/ui/ConfettiBlast'

interface Props {
  initialStep: number
  userId: string
  displayName: string
  company: string
}

const TOTAL_STEPS = 4

const STEP_CELEBRATIONS: Record<number, { colors: string[]; message: string }> = {
  2: { colors: ['#C9A84C', '#fff', '#C9A84C'], message: "You're already showing up." },
}

const ALL_PILLAR_COLORS = ['#FFA538', '#A78BFA', '#F87171', '#60A5FA', '#C9A84C', '#0ABFA3']

export function OnboardingFlow({ initialStep, userId, displayName }: Props) {
  // Map legacy step 5 (old complete) / 4 (old post) onto the new 4-step path
  const normalized = Math.min(Math.max(1, initialStep > 4 ? 4 : initialStep), TOTAL_STEPS)
  const [currentStep, setCurrentStep] = useState(normalized)
  const [celebrating, setCelebrating] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState('')
  const [celebrationColors, setCelebrationColors] = useState<string[]>([])
  const [pillarColor, setPillarColor] = useState('#FFA538')

  async function saveStep(step: number) {
    await fetch('/api/onboarding/step', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    })
  }

  async function skip() {
    const next = currentStep + 1
    if (next > TOTAL_STEPS) return
    await saveStep(next)
    setCurrentStep(next)
  }

  const advance = useCallback(async () => {
    const next = currentStep + 1
    if (next > TOTAL_STEPS) return

    const config = STEP_CELEBRATIONS[currentStep]
    if (config) {
      setCelebrationColors(config.colors)
      setCelebrationMessage(config.message)
      setCelebrating(true)
      await saveStep(next)
      setTimeout(() => {
        setCelebrating(false)
        setCelebrationMessage('')
        setCurrentStep(next)
      }, 1200)
    } else if (currentStep === 3) {
      // Pillar chosen — short beat then complete
      setCelebrationColors([pillarColor, '#fff', pillarColor])
      setCelebrationMessage('Your path is set. Time to train.')
      setCelebrating(true)
      await saveStep(next)
      setTimeout(() => {
        setCelebrating(false)
        setCelebrationMessage('')
        setCurrentStep(next)
      }, 1200)
    } else {
      await saveStep(next)
      setCurrentStep(next)
    }
  }, [currentStep, pillarColor])

  useEffect(() => {
    if (currentStep === 4) {
      setCelebrationColors(ALL_PILLAR_COLORS)
      setCelebrating(true)
      setTimeout(() => setCelebrating(false), 2200)
    }
  }, [currentStep])

  function handlePillarContinue(color?: string) {
    if (color) setPillarColor(color)
    void advance()
  }

  return (
    <div style={{ width: '100%', maxWidth: '480px' }}>
      <ConfettiBlast
        active={celebrating}
        colors={celebrationColors}
        count={currentStep === 4 ? 50 : 28}
      />

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
          fontFamily: 'var(--font-condensed), sans-serif',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          textAlign: 'center',
          margin: '0 0 28px',
        }}
      >
        Step {currentStep} of {TOTAL_STEPS} · under 2 minutes
      </p>

      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '36px 32px',
          position: 'relative',
        }}
      >
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
                padding: '0 24px',
              }}
            >
              {celebrationMessage}
            </p>
          </div>
        )}

        {currentStep === 1 && <OnboardingWelcome displayName={displayName} onContinue={advance} />}
        {currentStep === 2 && <OnboardingProfile userId={userId} onContinue={advance} />}
        {currentStep === 3 && <OnboardingPillar onContinue={handlePillarContinue} />}
        {currentStep === 4 && <OnboardingComplete displayName={displayName} />}
      </div>

      {currentStep < TOTAL_STEPS && currentStep !== 3 && !celebrating && (
        <button
          type="button"
          onClick={() => void skip()}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '16px',
            padding: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-condensed), sans-serif',
            fontSize: '12px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.25)',
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
