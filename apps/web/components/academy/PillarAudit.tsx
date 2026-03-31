'use client'

import { useState } from 'react'

interface Question {
  id: string
  text: string
}

interface Props {
  pillarId: string
  courseId: string
  questions: Question[]
  pillarColor?: string
}

interface SavedAudit {
  id: string
  score: number | null
  created_at: string
}

const SCORE_LABELS: Record<number, string> = {
  1: 'Strongly disagree',
  2: 'Disagree',
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly agree',
}

export function PillarAudit({ courseId, questions, pillarColor = '#C9A84C' }: Props) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState<SavedAudit | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retaking, setRetaking] = useState(false)

  const allAnswered = questions.every(q => scores[q.id] !== undefined)
  const totalScore = allAnswered
    ? Math.round(Object.values(scores).reduce((s, v) => s + v, 0) / questions.length * 20)
    : 0

  async function handleSubmit() {
    if (!allAnswered) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/pillar-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, scores, total_score: totalScore }),
      })
      const json = await res.json() as SavedAudit & { error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Failed to save audit')
        return
      }
      setSaved(json)
      setRetaking(false)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  function handleRetake() {
    setScores({})
    setSaved(null)
    setRetaking(true)
  }

  // Summary view
  if (saved && !retaking) {
    const displayScore = saved.score ?? totalScore
    return (
      <div
        style={{
          backgroundColor: '#111926',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '8px',
          padding: '28px',
        }}
      >
        <p
          style={{
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
            color: pillarColor, margin: '0 0 20px',
          }}
        >
          Pillar Audit — Complete
        </p>
        {/* Score display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900,
                fontSize: '56px', lineHeight: 1, color: pillarColor, margin: 0,
              }}
            >
              {displayScore}
            </p>
            <p
              style={{
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'rgba(250,249,247,0.3)', margin: '4px 0 0',
              }}
            >
              / 100
            </p>
          </div>
          <div style={{ flex: 1 }}>
            {/* Score bar */}
            <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '4px', marginBottom: '8px' }}>
              <div
                style={{
                  height: '100%', width: `${displayScore}%`,
                  backgroundColor: pillarColor, borderRadius: '4px', transition: 'width 0.6s ease',
                }}
              />
            </div>
            <p style={{ color: 'rgba(250,249,247,0.45)', fontSize: '13px', margin: 0 }}>
              {displayScore >= 80 ? 'Strong foundation in this pillar.' :
               displayScore >= 60 ? 'Good progress — keep building.' :
               displayScore >= 40 ? 'Room to grow. Focus here.' :
               'This pillar needs dedicated work.'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(250,249,247,0.25)' }}>
            Completed {new Date(saved.created_at).toLocaleDateString()}
          </span>
          <button
            type="button"
            onClick={handleRetake}
            style={{
              background: 'none', border: `1px solid rgba(255,255,255,0.12)`,
              borderRadius: '4px', padding: '6px 14px',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(250,249,247,0.5)', cursor: 'pointer',
            }}
          >
            Retake
          </button>
        </div>
      </div>
    )
  }

  // Question form
  return (
    <div
      style={{
        backgroundColor: '#111926',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '8px',
        padding: '28px',
      }}
    >
      <p
        style={{
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: pillarColor, margin: '0 0 4px',
        }}
      >
        Pillar Audit
      </p>
      <p style={{ color: 'rgba(250,249,247,0.45)', fontSize: '13px', margin: '0 0 28px' }}>
        Rate each statement from 1 (strongly disagree) to 5 (strongly agree).
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '32px' }}>
        {questions.map((q, idx) => (
          <div key={q.id}>
            <p style={{ color: '#faf9f7', fontSize: '14px', lineHeight: 1.5, margin: '0 0 12px' }}>
              <span style={{ color: 'rgba(250,249,247,0.3)', marginRight: '8px', fontFamily: '"Barlow Condensed", sans-serif', fontSize: '12px', fontWeight: 700 }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              {q.text}
            </p>
            {/* 1-5 rating buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(val => {
                const isSelected = scores[q.id] === val
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setScores(prev => ({ ...prev, [q.id]: val }))}
                    title={SCORE_LABELS[val]}
                    style={{
                      width: '40px', height: '40px', borderRadius: '4px',
                      backgroundColor: isSelected ? pillarColor : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isSelected ? pillarColor : 'rgba(255,255,255,0.1)'}`,
                      color: isSelected ? '#0A0F18' : 'rgba(250,249,247,0.5)',
                      fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '14px',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {val}
                  </button>
                )
              })}
              {scores[q.id] && (
                <span style={{ fontSize: '12px', color: 'rgba(250,249,247,0.3)', alignSelf: 'center', marginLeft: '4px' }}>
                  {SCORE_LABELS[scores[q.id]]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: 'rgba(250,249,247,0.25)' }}>
          {Object.keys(scores).length} / {questions.length} answered
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {error && <span style={{ fontSize: '12px', color: '#ef0e30' }}>{error}</span>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            style={{
              backgroundColor: allAnswered ? pillarColor : 'rgba(201,168,76,0.15)',
              color: allAnswered ? '#0A0F18' : 'rgba(201,168,76,0.35)',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '10px 24px', borderRadius: '4px', border: 'none',
              cursor: allAnswered ? 'pointer' : 'default', transition: 'all 0.2s',
            }}
          >
            {submitting ? 'Saving…' : 'Submit Audit'}
          </button>
        </div>
      </div>
    </div>
  )
}
