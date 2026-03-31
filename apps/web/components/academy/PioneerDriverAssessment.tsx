'use client'

import { useState, useEffect } from 'react'

type AssessmentType = 'PIONEER' | 'DRIVER' | 'CONNECTOR' | 'ARCHITECT'
type AnswerKey = 'A' | 'B' | 'C' | 'D'

interface Question {
  id: number
  text: string
  options: Record<AnswerKey, { label: string; type: AssessmentType }>
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'When you walk into a new sales meeting, your first priority is…',
    options: {
      A: { label: 'Build rapport and find common ground', type: 'CONNECTOR' },
      B: { label: 'Understand their process and gather data', type: 'ARCHITECT' },
      C: { label: 'Paint the vision of what\'s possible', type: 'PIONEER' },
      D: { label: 'Qualify fast and move to the close', type: 'DRIVER' },
    },
  },
  {
    id: 2,
    text: 'Your best deals usually come from…',
    options: {
      A: { label: 'Referrals and long-term relationships', type: 'CONNECTOR' },
      B: { label: 'A tight, repeatable process', type: 'ARCHITECT' },
      C: { label: 'Opening new markets or categories', type: 'PIONEER' },
      D: { label: 'Outworking the competition', type: 'DRIVER' },
    },
  },
  {
    id: 3,
    text: 'When a deal stalls, you typically…',
    options: {
      A: { label: 'Check in personally and rebuild the relationship', type: 'CONNECTOR' },
      B: { label: 'Audit the process and identify the breakdown point', type: 'ARCHITECT' },
      C: { label: 'Re-frame the opportunity with a bigger vision', type: 'PIONEER' },
      D: { label: 'Push harder and set a hard deadline', type: 'DRIVER' },
    },
  },
  {
    id: 4,
    text: 'Your ideal client interaction looks like…',
    options: {
      A: { label: 'A genuine conversation where you learn about their world', type: 'CONNECTOR' },
      B: { label: 'A structured needs analysis with clear criteria', type: 'ARCHITECT' },
      C: { label: 'Exploring possibilities they haven\'t considered yet', type: 'PIONEER' },
      D: { label: 'A direct pitch followed by a confident ask', type: 'DRIVER' },
    },
  },
  {
    id: 5,
    text: 'When you miss a target, your first move is…',
    options: {
      A: { label: 'Talk to someone you trust to get perspective', type: 'CONNECTOR' },
      B: { label: 'Review your data and identify the gap', type: 'ARCHITECT' },
      C: { label: 'Reimagine your approach from a new angle', type: 'PIONEER' },
      D: { label: 'Set a bigger goal and increase your activity', type: 'DRIVER' },
    },
  },
  {
    id: 6,
    text: 'Other people would describe your selling style as…',
    options: {
      A: { label: 'Warm, genuine, and trustworthy', type: 'CONNECTOR' },
      B: { label: 'Thorough, precise, and well-prepared', type: 'ARCHITECT' },
      C: { label: 'Inspiring, energetic, and forward-thinking', type: 'PIONEER' },
      D: { label: 'Confident, direct, and relentless', type: 'DRIVER' },
    },
  },
  {
    id: 7,
    text: 'Your greatest strength in a competitive deal is…',
    options: {
      A: { label: 'The loyalty and trust you\'ve built over time', type: 'CONNECTOR' },
      B: { label: 'Your depth of knowledge and preparation', type: 'ARCHITECT' },
      C: { label: 'Your ability to see and sell a bigger future', type: 'PIONEER' },
      D: { label: 'Your urgency and willingness to outwork anyone', type: 'DRIVER' },
    },
  },
  {
    id: 8,
    text: 'The part of the sales cycle you enjoy most is…',
    options: {
      A: { label: 'Building the relationship and earning trust', type: 'CONNECTOR' },
      B: { label: 'Crafting the proposal and tailored solution', type: 'ARCHITECT' },
      C: { label: 'The first meeting — opening a brand-new conversation', type: 'PIONEER' },
      D: { label: 'Closing the deal and winning', type: 'DRIVER' },
    },
  },
  {
    id: 9,
    text: 'When building your pipeline, you prioritise…',
    options: {
      A: { label: 'Deepening existing relationships for referrals', type: 'CONNECTOR' },
      B: { label: 'Working a repeatable, documented prospecting system', type: 'ARCHITECT' },
      C: { label: 'Targeting new markets or untapped segments', type: 'PIONEER' },
      D: { label: 'Volume — more calls, more meetings, more closes', type: 'DRIVER' },
    },
  },
  {
    id: 10,
    text: 'In a team environment, you naturally become…',
    options: {
      A: { label: 'The one people trust with sensitive situations', type: 'CONNECTOR' },
      B: { label: 'The one who creates playbooks and best practices', type: 'ARCHITECT' },
      C: { label: 'The one with bold ideas who rallies the group', type: 'PIONEER' },
      D: { label: 'The one leading the scoreboard', type: 'DRIVER' },
    },
  },
  {
    id: 11,
    text: 'You believe the most important sales skill is…',
    options: {
      A: { label: 'Active listening and emotional intelligence', type: 'CONNECTOR' },
      B: { label: 'Preparation and mastery of your product or service', type: 'ARCHITECT' },
      C: { label: 'Creative thinking and vision-casting', type: 'PIONEER' },
      D: { label: 'Relentless follow-up and closing ability', type: 'DRIVER' },
    },
  },
  {
    id: 12,
    text: 'When a client says no, you…',
    options: {
      A: { label: 'Respect it, keep the relationship warm, and stay in touch', type: 'CONNECTOR' },
      B: { label: 'Ask for feedback and analyse what could be improved', type: 'ARCHITECT' },
      C: { label: 'Pivot and reframe the conversation around a new angle', type: 'PIONEER' },
      D: { label: 'Push back, overcome the objection, and ask again', type: 'DRIVER' },
    },
  },
]

const TYPE_DATA: Record<AssessmentType, {
  headline: string
  description: string
  strengths: string[]
  superpower: string
}> = {
  PIONEER: {
    headline: "YOU'RE A PIONEER",
    description: "You see what others can't yet see — and you sell the vision. Pioneers thrive on new conversations, bold ideas, and opening doors that didn't exist before. You energise rooms, inspire clients, and naturally gravitate toward leading-edge opportunities. Where others see a saturated market, you see a new angle.",
    strengths: [
      'Opening new relationships and markets with ease',
      'Painting compelling visions that move people to action',
      'Thriving in uncharted territory where process hasn\'t been set',
    ],
    superpower: "You don't just sell products — you sell futures.",
  },
  DRIVER: {
    headline: "YOU'RE A DRIVER",
    description: "You are the closer. Results are your language, competition is your fuel, and no finish line is ever final — you're already setting the next one. Drivers are relentless, direct, and deeply motivated by winning. You don't need motivation from others; you generate your own.",
    strengths: [
      'Converting opportunities to closed deals at a high rate',
      'Outworking the competition through sheer activity and will',
      'Creating urgency and momentum in any sales cycle',
    ],
    superpower: "You make things happen — every day, without exception.",
  },
  CONNECTOR: {
    headline: "YOU'RE A CONNECTOR",
    description: "Your greatest asset is trust. Connectors build the kind of relationships where clients don't just buy — they advocate. You play the long game, and it pays off. People feel genuinely heard in your presence, and that creates loyalty that no competitor can easily displace.",
    strengths: [
      'Generating a high-quality referral pipeline from loyal clients',
      'Navigating complex stakeholder environments with empathy',
      'Creating lifetime relationships that compound in value',
    ],
    superpower: "You don't just close deals — you open lifelong partnerships.",
  },
  ARCHITECT: {
    headline: "YOU'RE AN ARCHITECT",
    description: "You build systems that make success inevitable. Architects are the professionals who others admire for their preparation, precision, and repeatability. You don't rely on instinct alone — you understand the mechanics of performance and engineer your way to consistent results.",
    strengths: [
      'Building repeatable processes that eliminate guesswork',
      'Delivering deeply prepared, tailored solutions to complex problems',
      'Identifying the specific leverage point in any underperforming area',
    ],
    superpower: "You don't hope for results — you engineer them.",
  },
}

const GOLD = '#C9A84C'

interface SavedResult {
  type_result: AssessmentType
  scores_json: Record<AssessmentType, number>
  created_at: string
}

export function PioneerDriverAssessment() {
  const [currentQ, setCurrentQ] = useState(0)
  const [scores, setScores] = useState<Record<AssessmentType, number>>({ PIONEER: 0, DRIVER: 0, CONNECTOR: 0, ARCHITECT: 0 })
  const [result, setResult] = useState<AssessmentType | null>(null)
  const [savedResult, setSavedResult] = useState<SavedResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [retaking, setRetaking] = useState(false)

  // Load existing result on mount
  useEffect(() => {
    fetch('/api/assessments/pioneer-driver')
      .then(r => r.json())
      .then((data: { assessment?: SavedResult; error?: string }) => {
        if (data.assessment) setSavedResult(data.assessment)
      })
      .catch(() => {/* ignore */})
      .finally(() => setLoading(false))
  }, [])

  function handleAnswer(type: AssessmentType) {
    const next = { ...scores, [type]: scores[type] + 1 }
    setScores(next)
    if (currentQ + 1 >= QUESTIONS.length) {
      // Calculate result
      const winner = (Object.entries(next) as [AssessmentType, number][])
        .sort((a, b) => b[1] - a[1])[0][0]
      setResult(winner)
    } else {
      setCurrentQ(q => q + 1)
    }
  }

  async function handleSave(typeResult: AssessmentType) {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/assessments/pioneer-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type_result: typeResult, scores_json: scores }),
      })
      const json = await res.json() as { assessment?: SavedResult; error?: string }
      if (!res.ok) {
        setSaveError(json.error ?? 'Failed to save result')
        return
      }
      if (json.assessment) setSavedResult(json.assessment)
      setSaved(true)
    } catch {
      setSaveError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  function handleRetake() {
    setCurrentQ(0)
    setScores({ PIONEER: 0, DRIVER: 0, CONNECTOR: 0, ARCHITECT: 0 })
    setResult(null)
    setSaved(false)
    setSaveError(null)
    setRetaking(true)
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#111926', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(250,249,247,0.3)', fontSize: '13px', fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Loading assessment…
        </p>
      </div>
    )
  }

  // Show saved result (on mount or after save) unless retaking
  const displayResult = retaking ? result : (result ?? (savedResult?.type_result ?? null))
  const isFromSaved = !retaking && !result && !!savedResult

  if (displayResult) {
    const typeData = TYPE_DATA[displayResult]
    return (
      <ResultScreen
        typeData={typeData}
        result={displayResult}
        isFromSaved={isFromSaved}
        saved={saved}
        saving={saving}
        saveError={saveError}
        savedDate={savedResult?.created_at ?? null}
        onSave={() => handleSave(displayResult)}
        onRetake={handleRetake}
      />
    )
  }

  // Quiz
  const question = QUESTIONS[currentQ]
  const progress = Math.round(((currentQ) / QUESTIONS.length) * 100)

  return (
    <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '28px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: GOLD, margin: '0 0 4px',
        }}>
          Pioneer-Driver Assessment
        </p>
        <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 16px' }}>
          Discover your professional sales type
        </p>

        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '3px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${progress}%`, backgroundColor: GOLD, borderRadius: '2px', transition: 'width 0.3s ease' }} />
          </div>
          <span style={{
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(250,249,247,0.4)',
            flexShrink: 0,
          }}>
            {currentQ + 1} / {QUESTIONS.length}
          </span>
        </div>
      </div>

      {/* Question */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#faf9f7', fontSize: '17px', lineHeight: 1.55, fontWeight: 500, margin: 0 }}>
          {question.text}
        </p>
      </div>

      {/* Answer options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(['A', 'B', 'C', 'D'] as AnswerKey[]).map(key => {
          const opt = question.options[key]
          return (
            <AnswerButton
              key={key}
              label={key}
              text={opt.label}
              onClick={() => handleAnswer(opt.type)}
            />
          )
        })}
      </div>
    </div>
  )
}

function AnswerButton({ label, text, onClick }: { label: string; text: string; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '14px',
        width: '100%', textAlign: 'left',
        backgroundColor: hovered ? `${GOLD}0D` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? GOLD + '44' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: '6px', padding: '14px 16px',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      <span style={{
        flexShrink: 0,
        width: '22px', height: '22px', borderRadius: '50%',
        backgroundColor: hovered ? `${GOLD}22` : 'rgba(255,255,255,0.06)',
        border: `1px solid ${hovered ? GOLD : 'rgba(255,255,255,0.15)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
        fontSize: '11px', letterSpacing: '0.05em',
        color: hovered ? GOLD : 'rgba(250,249,247,0.5)',
        transition: 'all 0.15s',
      }}>
        {label}
      </span>
      <span style={{ color: hovered ? '#faf9f7' : 'rgba(250,249,247,0.75)', fontSize: '14px', lineHeight: 1.5, transition: 'color 0.15s' }}>
        {text}
      </span>
    </button>
  )
}

function ResultScreen({
  typeData, result, isFromSaved, saved, saving, saveError, savedDate, onSave, onRetake,
}: {
  typeData: typeof TYPE_DATA[AssessmentType]
  result: AssessmentType
  isFromSaved: boolean
  saved: boolean
  saving: boolean
  saveError: string | null
  savedDate: string | null
  onSave: () => void
  onRetake: () => void
}) {
  const TYPE_COLORS: Record<AssessmentType, string> = {
    PIONEER: '#A78BFA',
    DRIVER: '#F87171',
    CONNECTOR: '#60A5FA',
    ARCHITECT: '#0ABFA3',
  }
  const typeColor = TYPE_COLORS[result]
  const formattedDate = savedDate
    ? new Date(savedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Color bar */}
      <div style={{ height: '4px', backgroundColor: typeColor }} />

      <div style={{ padding: '28px' }}>
        {/* Saved badge */}
        {isFromSaved && formattedDate && (
          <p style={{
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(250,249,247,0.3)', margin: '0 0 16px',
          }}>
            Assessed {formattedDate}
          </p>
        )}

        {/* Assessment label */}
        <p style={{
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: GOLD, margin: '0 0 8px',
        }}>
          Pioneer-Driver Assessment
        </p>

        {/* Type name */}
        <h2 style={{
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900,
          fontSize: 'clamp(28px, 5vw, 44px)', textTransform: 'uppercase',
          color: typeColor, margin: '0 0 20px', letterSpacing: '0.04em', lineHeight: 1,
        }}>
          {typeData.headline}
        </h2>

        {/* Description */}
        <p style={{ color: 'rgba(250,249,247,0.7)', fontSize: '14px', lineHeight: 1.7, margin: '0 0 24px', maxWidth: '680px' }}>
          {typeData.description}
        </p>

        {/* Strengths */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: 'rgba(250,249,247,0.35)', margin: '0 0 10px',
          }}>
            Your Strengths
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {typeData.strengths.map((s, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: typeColor, fontSize: '16px', lineHeight: 1.3, flexShrink: 0 }}>→</span>
                <span style={{ color: 'rgba(250,249,247,0.65)', fontSize: '13px', lineHeight: 1.6 }}>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Superpower */}
        <div style={{
          backgroundColor: `${typeColor}0D`,
          border: `1px solid ${typeColor}22`,
          borderRadius: '6px', padding: '14px 18px', marginBottom: '28px',
        }}>
          <p style={{
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: typeColor, margin: '0 0 6px',
          }}>
            Your Sales Superpower
          </p>
          <p style={{ color: '#faf9f7', fontSize: '14px', fontWeight: 600, margin: 0, fontStyle: 'italic' }}>
            &ldquo;{typeData.superpower}&rdquo;
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {!isFromSaved && !saved && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              style={{
                backgroundColor: GOLD, color: '#0A0F18',
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '11px 24px', borderRadius: '4px', border: 'none',
                cursor: saving ? 'default' : 'pointer',
              }}
            >
              {saving ? 'Saving…' : 'Save My Result'}
            </button>
          )}
          {saved && (
            <span style={{
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
              color: typeColor,
            }}>
              ✓ Result Saved
            </span>
          )}
          {saveError && (
            <span style={{ fontSize: '12px', color: '#ef0e30' }}>{saveError}</span>
          )}
          <button
            type="button"
            onClick={onRetake}
            style={{
              background: 'none', border: 'none',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'rgba(250,249,247,0.3)', cursor: 'pointer', padding: 0,
            }}
          >
            Retake Assessment
          </button>
        </div>
      </div>
    </div>
  )
}
