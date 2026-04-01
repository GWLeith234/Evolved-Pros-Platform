'use client'

import { useState, useEffect } from 'react'

const CRIMSON = '#F87171'
const GOLD = '#C9A84C'

type Dimension = 'COMPOSURE' | 'CONSISTENCY' | 'COURAGE' | 'COMMITMENT'

interface DiagQuestion {
  id: string
  dimension: Dimension
  text: string
}

const QUESTIONS: DiagQuestion[] = [
  // COMPOSURE
  { id: 'c1', dimension: 'COMPOSURE',   text: 'I remain calm when deals fall apart at the last minute.' },
  { id: 'c2', dimension: 'COMPOSURE',   text: 'I can separate my self-worth from my sales results.' },
  { id: 'c3', dimension: 'COMPOSURE',   text: 'I maintain composure during difficult objections or client confrontations.' },
  { id: 'c4', dimension: 'COMPOSURE',   text: 'I can fully switch off and recover outside of working hours.' },
  // CONSISTENCY
  { id: 'co1', dimension: 'CONSISTENCY', text: 'I execute my daily non-negotiables regardless of how I feel.' },
  { id: 'co2', dimension: 'CONSISTENCY', text: 'My activity levels stay consistent whether I\'m on a hot streak or in a slump.' },
  { id: 'co3', dimension: 'CONSISTENCY', text: 'I show up with the same energy and effort on tough days as I do on good ones.' },
  { id: 'co4', dimension: 'CONSISTENCY', text: 'I maintain my process even when I\'m not seeing immediate results.' },
  // COURAGE
  { id: 'cr1', dimension: 'COURAGE',    text: 'I ask for the business directly even when I fear rejection.' },
  { id: 'cr2', dimension: 'COURAGE',    text: 'I have difficult conversations with clients or managers without avoiding them.' },
  { id: 'cr3', dimension: 'COURAGE',    text: 'I share my honest perspective even when it\'s uncomfortable or unpopular.' },
  { id: 'cr4', dimension: 'COURAGE',    text: 'I take on challenging goals even when failure is a real possibility.' },
  // COMMITMENT
  { id: 'cm1', dimension: 'COMMITMENT', text: 'I follow through on commitments I\'ve made to myself.' },
  { id: 'cm2', dimension: 'COMMITMENT', text: 'When I miss a target I recommit immediately rather than making excuses.' },
  { id: 'cm3', dimension: 'COMMITMENT', text: 'I keep going when progress is slow and results are not showing.' },
  { id: 'cm4', dimension: 'COMMITMENT', text: 'I hold myself accountable without waiting for external pressure.' },
]

const DIMENSIONS: Dimension[] = ['COMPOSURE', 'CONSISTENCY', 'COURAGE', 'COMMITMENT']

const DIMENSION_LABELS: Record<Dimension, string> = {
  COMPOSURE:   'Composure',
  CONSISTENCY: 'Consistency',
  COURAGE:     'Courage',
  COMMITMENT:  'Commitment',
}

const GROWTH_FOCUS: Record<Dimension, string> = {
  COMPOSURE:   'Build a decompression routine between calls — stress recovery is a trainable skill.',
  CONSISTENCY: 'Define your daily non-negotiables and protect them like client commitments.',
  COURAGE:     'Small acts of courage compound — lean into the uncomfortable conversation this week.',
  COMMITMENT:  'Hold commitments to yourself with the same rigour you hold them to others.',
}

const PROFILE_LABELS: Array<{ max: number; label: string; desc: string }> = [
  { max: 40, label: 'Building Resilience',    desc: 'You\'re developing the fundamentals of mental toughness. Focus on one dimension at a time.' },
  { max: 60, label: 'Developing Toughness',   desc: 'Solid base in place. The next level is in consistency under real pressure.' },
  { max: 80, label: 'Battle-Tested',           desc: 'You have the mental architecture of a top performer. Sharpen your weakest edge.' },
]

interface SavedResult {
  score: number
  result_json: {
    composure: number; consistency: number; courage: number; commitment: number
    answers: Record<string, number>
  } | null
  created_at: string
}

interface Props {
  courseId: string
}

export function MentalToughnessDiagnostic({ courseId }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SavedResult | null>(null)
  const [retaking, setRetaking] = useState(false)

  useEffect(() => {
    fetch(`/api/checkin-results?course_id=${encodeURIComponent(courseId)}&checkin_type=diagnostic`)
      .then(r => r.json())
      .then((data: { result?: SavedResult | null }) => {
        if (data.result) setResult(data.result)
      })
      .catch(() => {/* ignore */})
      .finally(() => setLoading(false))
  }, [courseId])

  const answeredCount = Object.keys(answers).length
  const totalQuestions = QUESTIONS.length
  const allAnswered = answeredCount === totalQuestions

  function setAnswer(questionId: string, value: number) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  function calcDimScore(dim: Dimension): number {
    return QUESTIONS
      .filter(q => q.dimension === dim)
      .reduce((sum, q) => sum + (answers[q.id] ?? 0), 0)
  }

  async function handleSubmit() {
    if (!allAnswered || submitting) return
    setSubmitting(true)

    const composure   = calcDimScore('COMPOSURE')
    const consistency = calcDimScore('CONSISTENCY')
    const courage     = calcDimScore('COURAGE')
    const commitment  = calcDimScore('COMMITMENT')
    const total = composure + consistency + courage + commitment

    try {
      const res = await fetch('/api/checkin-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          checkin_type: 'diagnostic',
          score: total,
          max_score: 80,
          result_json: { composure, consistency, courage, commitment, answers },
        }),
      })
      const json = await res.json() as { result?: SavedResult; error?: string }
      if (res.ok && json.result) {
        setResult({
          score: total,
          result_json: { composure, consistency, courage, commitment, answers },
          created_at: json.result.created_at,
        })
        setRetaking(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleRetake() {
    setAnswers({})
    setResult(null)
    setRetaking(true)
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#111926', borderRadius: '8px', padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(250,249,247,0.25)', fontSize: '12px', fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Loading diagnostic…
        </p>
      </div>
    )
  }

  // Result screen
  if (result && !retaking) {
    const dims: Record<Dimension, number> = {
      COMPOSURE:   result.result_json?.composure   ?? 0,
      CONSISTENCY: result.result_json?.consistency ?? 0,
      COURAGE:     result.result_json?.courage      ?? 0,
      COMMITMENT:  result.result_json?.commitment   ?? 0,
    }
    const total = result.score
    const pct = Math.round((total / 80) * 100)
    const profile = PROFILE_LABELS.find(p => total <= p.max) ?? PROFILE_LABELS[PROFILE_LABELS.length - 1]
    const lowestDim = (Object.entries(dims) as [Dimension, number][]).sort((a, b) => a[1] - b[1])[0][0]
    const formattedDate = new Date(result.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    return (
      <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ height: '4px', backgroundColor: CRIMSON }} />
        <div style={{ padding: '28px' }}>
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, margin: '0 0 4px' }}>
            Mental Toughness Diagnostic · {formattedDate}
          </p>
          <h3 style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: 'clamp(22px, 4vw, 32px)', textTransform: 'uppercase', color: CRIMSON, margin: '0 0 6px', letterSpacing: '0.04em' }}>
            {profile.label}
          </h3>
          <p style={{ color: 'rgba(250,249,247,0.5)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 24px', maxWidth: '520px' }}>
            {profile.desc}
          </p>

          {/* Overall score */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '24px' }}>
            <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: '48px', lineHeight: 1, color: CRIMSON }}>
              {total}
            </span>
            <span style={{ color: 'rgba(250,249,247,0.3)', fontSize: '20px' }}>/</span>
            <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '20px', color: 'rgba(250,249,247,0.4)' }}>80</span>
            <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(250,249,247,0.25)', marginLeft: '4px' }}>
              overall · {pct}%
            </span>
          </div>

          {/* Dimension bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', maxWidth: '480px' }}>
            {DIMENSIONS.map(dim => {
              const score = dims[dim]
              const dimPct = Math.round((score / 20) * 100)
              const isLowest = dim === lowestDim
              return (
                <div key={dim}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{
                      fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                      fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: isLowest ? CRIMSON : 'rgba(250,249,247,0.5)',
                    }}>
                      {DIMENSION_LABELS[dim]}
                      {isLowest && <span style={{ marginLeft: '6px', fontSize: '9px', letterSpacing: '0.1em', color: CRIMSON }}>▲ FOCUS</span>}
                    </span>
                    <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '11px', color: isLowest ? CRIMSON : 'rgba(250,249,247,0.4)' }}>
                      {score} / 20
                    </span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '3px' }}>
                    <div style={{
                      height: '100%', width: `${dimPct}%`,
                      backgroundColor: isLowest ? CRIMSON : `${CRIMSON}66`,
                      borderRadius: '3px', transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Growth focus */}
          <div style={{
            backgroundColor: `${CRIMSON}0D`, border: `1px solid ${CRIMSON}22`,
            borderRadius: '6px', padding: '14px 18px', marginBottom: '24px', maxWidth: '520px',
          }}>
            <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: CRIMSON, margin: '0 0 6px' }}>
              Growth Focus — {DIMENSION_LABELS[lowestDim]}
            </p>
            <p style={{ color: 'rgba(250,249,247,0.65)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              {GROWTH_FOCUS[lowestDim]}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRetake}
            style={{
              background: 'none', border: 'none',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase',
              color: 'rgba(250,249,247,0.3)', cursor: 'pointer', padding: 0,
            }}
          >
            Retake Diagnostic
          </button>
        </div>
      </div>
    )
  }

  // Form
  return (
    <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '28px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, margin: '0 0 4px' }}>
          Mental Toughness Diagnostic
        </p>
        <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 6px' }}>
          Resilience Self-Assessment — 4 Dimensions, 16 Questions
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, maxWidth: '280px', height: '3px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${Math.round((answeredCount / totalQuestions) * 100)}%`, backgroundColor: CRIMSON, borderRadius: '2px', transition: 'width 0.2s' }} />
          </div>
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(250,249,247,0.4)' }}>
            {answeredCount} / {totalQuestions} answered
          </span>
        </div>
      </div>

      {/* Questions grouped by dimension */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '28px' }}>
        {DIMENSIONS.map(dim => {
          const dimQuestions = QUESTIONS.filter(q => q.dimension === dim)
          const dimAnswered = dimQuestions.filter(q => answers[q.id] !== undefined).length
          return (
            <div key={dim}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: CRIMSON, margin: 0 }}>
                  {DIMENSION_LABELS[dim]}
                </p>
                <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: '10px', letterSpacing: '0.1em', color: dimAnswered === 4 ? CRIMSON : 'rgba(250,249,247,0.2)' }}>
                  {dimAnswered}/4
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {dimQuestions.map(q => (
                  <RatingRow
                    key={q.id}
                    question={q.text}
                    value={answers[q.id] ?? null}
                    onChange={v => setAnswer(q.id, v)}
                    color={CRIMSON}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Rating legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        {[['1', 'Never'], ['2', 'Rarely'], ['3', 'Sometimes'], ['4', 'Often'], ['5', 'Always']].map(([num, label]) => (
          <span key={num} style={{ fontSize: '11px', color: 'rgba(250,249,247,0.25)', fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.06em' }}>
            <span style={{ fontWeight: 700 }}>{num}</span> = {label}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allAnswered || submitting}
        style={{
          backgroundColor: allAnswered ? CRIMSON : `${CRIMSON}22`,
          color: allAnswered ? '#0A0F18' : `${CRIMSON}55`,
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '12px 28px', borderRadius: '4px', border: 'none',
          cursor: allAnswered ? 'pointer' : 'default', transition: 'all 0.2s',
        }}
      >
        {submitting ? 'Submitting…' : allAnswered ? 'Submit Diagnostic' : `Answer All Questions to Submit`}
      </button>
    </div>
  )
}

function RatingRow({ question, value, onChange, color }: {
  question: string
  value: number | null
  onChange: (v: number) => void
  color: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
      <p style={{ flex: 1, color: 'rgba(250,249,247,0.72)', fontSize: '13px', lineHeight: 1.55, margin: 0, minWidth: 0 }}>
        {question}
      </p>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        {[1, 2, 3, 4, 5].map(n => {
          const isSelected = value === n
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              style={{
                width: '32px', height: '32px', borderRadius: '4px',
                backgroundColor: isSelected ? color : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isSelected ? color : 'rgba(255,255,255,0.1)'}`,
                color: isSelected ? '#0A0F18' : 'rgba(250,249,247,0.45)',
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '13px',
                cursor: 'pointer', transition: 'all 0.15s', padding: 0,
              }}
            >
              {n}
            </button>
          )
        })}
      </div>
    </div>
  )
}
