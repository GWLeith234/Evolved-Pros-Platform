'use client'

import { useState } from 'react'

interface Option {
  id: string
  text: string
  isCorrect: boolean
  explanation: string
}

interface Question {
  id: string
  scenario: string
  options: Option[]
}

interface Props {
  courseId: string
  moduleNumber: number
  questions: Question[]
}

const TEAL = '#0ABFA3'
const RED_ERR = '#C9302A'
const GOLD = '#C9A84C'

type AnswerState = { selectedId: string; isCorrect: boolean; explanation: string } | null

export function ScenarioMCQ({ courseId, moduleNumber, questions }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<AnswerState[]>(Array(questions.length).fill(null))
  const [complete, setComplete] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const question = questions[currentIdx]
  const answer = answers[currentIdx]
  const correctCount = answers.filter(a => a?.isCorrect).length
  const isLast = currentIdx === questions.length - 1

  function handleSelect(option: Option) {
    if (answer) return // already answered
    const newAnswers = [...answers]
    newAnswers[currentIdx] = {
      selectedId: option.id,
      isCorrect: option.isCorrect,
      explanation: option.isCorrect
        ? option.explanation
        : (question.options.find(o => o.isCorrect)?.explanation ?? ''),
    }
    setAnswers(newAnswers)
  }

  function handleNext() {
    if (isLast) {
      setComplete(true)
    } else {
      setCurrentIdx(i => i + 1)
    }
  }

  async function handleSubmit(score: number) {
    if (submitting || submitted) return
    setSubmitting(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/checkin-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          module_number: moduleNumber,
          checkin_type: 'mcq',
          score,
          max_score: questions.length,
          result_json: answers.map((a, i) => ({
            question_id: questions[i].id,
            selected_id: a?.selectedId ?? null,
            correct: a?.isCorrect ?? false,
          })),
        }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const json = await res.json().catch(() => ({})) as { error?: string }
        setSaveError(json.error ?? 'Failed to save result')
      }
    } catch {
      setSaveError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  function handleRetake() {
    setCurrentIdx(0)
    setAnswers(Array(questions.length).fill(null))
    setComplete(false)
    setSubmitted(false)
  }

  // Score summary screen
  if (complete) {
    const pct = Math.round((correctCount / questions.length) * 100)
    const message =
      pct === 100 ? 'Perfect score. Sharp thinking.' :
      pct >= 80   ? 'Strong result. You\'re thinking like a pro.' :
      pct >= 60   ? 'Good foundation. Review the explanations to sharpen your edge.' :
                    'Keep working through the material — revisit the scenarios and retake.'

    return (
      <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ height: '3px', backgroundColor: pct >= 80 ? TEAL : pct >= 60 ? GOLD : RED_ERR }} />
        <div style={{ padding: '28px' }}>
          <p style={{
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
            color: GOLD, margin: '0 0 8px',
          }}>
            Module {moduleNumber} Check-In · Results
          </p>

          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
            <span style={{
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900,
              fontSize: '52px', lineHeight: 1, color: pct >= 80 ? TEAL : pct >= 60 ? GOLD : RED_ERR,
            }}>
              {correctCount}
            </span>
            <span style={{ color: 'rgba(250,249,247,0.3)', fontSize: '24px', fontWeight: 300 }}>/</span>
            <span style={{
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '24px', color: 'rgba(250,249,247,0.5)',
            }}>
              {questions.length}
            </span>
            <span style={{
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '13px', letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(250,249,247,0.3)', marginLeft: '4px',
            }}>
              correct
            </span>
          </div>

          <p style={{ color: 'rgba(250,249,247,0.6)', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px', maxWidth: '520px' }}>
            {message}
          </p>

          {/* Answer review */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '28px' }}>
            {questions.map((q, i) => {
              const a = answers[i]
              const wasCorrect = a?.isCorrect
              return (
                <div key={q.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  backgroundColor: wasCorrect ? `${TEAL}0A` : `${RED_ERR}0A`,
                  border: `1px solid ${wasCorrect ? TEAL + '22' : RED_ERR + '22'}`,
                  borderRadius: '4px', padding: '10px 12px',
                }}>
                  <span style={{ flexShrink: 0, fontSize: '14px', lineHeight: 1.3, marginTop: '1px' }}>
                    {wasCorrect ? '✓' : '✗'}
                  </span>
                  <div>
                    <p style={{ color: 'rgba(250,249,247,0.7)', fontSize: '12px', margin: '0 0 4px', lineHeight: 1.5 }}>
                      {q.scenario.length > 80 ? q.scenario.slice(0, 80) + '…' : q.scenario}
                    </p>
                    <p style={{ color: 'rgba(250,249,247,0.35)', fontSize: '11px', margin: 0, lineHeight: 1.4 }}>
                      {a?.explanation}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {!submitted && (
              <button
                type="button"
                onClick={() => handleSubmit(correctCount)}
                disabled={submitting}
                style={{
                  backgroundColor: GOLD, color: '#0A0F18',
                  fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                  fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '11px 24px', borderRadius: '4px', border: 'none',
                  cursor: submitting ? 'default' : 'pointer',
                }}
              >
                {submitting ? 'Saving…' : 'Save Result'}
              </button>
            )}
            {saveError && !submitted && (
              <span style={{
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: RED_ERR,
              }}>
                {saveError}
              </span>
            )}
            {submitted && (
              <span style={{
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: TEAL,
              }}>
                ✓ Result Saved
              </span>
            )}
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
              Retake
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Question screen
  const progress = Math.round((currentIdx / questions.length) * 100)

  return (
    <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '28px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: GOLD, margin: '0 0 4px',
        }}>
          Module {moduleNumber} Check-In
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '3px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
            <div style={{ height: '100%', width: `${progress}%`, backgroundColor: TEAL, borderRadius: '2px', transition: 'width 0.3s ease' }} />
          </div>
          <span style={{
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(250,249,247,0.4)', flexShrink: 0,
          }}>
            {currentIdx + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Scenario */}
      <p style={{ color: '#faf9f7', fontSize: '16px', fontWeight: 600, lineHeight: 1.55, margin: '0 0 20px' }}>
        {question.scenario}
      </p>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: answer ? '20px' : '0' }}>
        {question.options.map(opt => {
          const isSelected = answer?.selectedId === opt.id
          const isCorrect = opt.isCorrect
          let borderColor = 'rgba(255,255,255,0.08)'
          let bgColor = 'rgba(255,255,255,0.02)'
          let textColor = 'rgba(250,249,247,0.75)'

          if (answer) {
            if (isSelected && isCorrect) {
              borderColor = `${TEAL}66`; bgColor = `${TEAL}12`; textColor = '#faf9f7'
            } else if (isSelected && !isCorrect) {
              borderColor = `${RED_ERR}66`; bgColor = `${RED_ERR}12`; textColor = '#faf9f7'
            } else if (!isSelected && isCorrect) {
              borderColor = `${TEAL}33`; bgColor = `${TEAL}08`; textColor = 'rgba(250,249,247,0.55)'
            }
          }

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleSelect(opt)}
              disabled={!!answer}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px', width: '100%',
                textAlign: 'left', backgroundColor: bgColor, border: `1px solid ${borderColor}`,
                borderRadius: '6px', padding: '13px 16px', cursor: answer ? 'default' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {answer && (
                <span style={{
                  flexShrink: 0, fontSize: '14px', lineHeight: '1.4', marginTop: '1px',
                  color: isSelected ? (isCorrect ? TEAL : RED_ERR) : (isCorrect ? TEAL : 'transparent'),
                }}>
                  {isCorrect ? '✓' : (isSelected ? '✗' : '✗')}
                </span>
              )}
              <span style={{ color: textColor, fontSize: '14px', lineHeight: 1.5 }}>
                {opt.text}
              </span>
            </button>
          )
        })}
      </div>

      {/* Explanation + Next */}
      {answer && (
        <div style={{ marginTop: '16px' }}>
          <div style={{
            backgroundColor: answer.isCorrect ? `${TEAL}0D` : `${GOLD}0D`,
            border: `1px solid ${answer.isCorrect ? TEAL + '22' : GOLD + '22'}`,
            borderRadius: '6px', padding: '12px 16px', marginBottom: '16px',
          }}>
            <p style={{
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase',
              color: answer.isCorrect ? TEAL : GOLD, margin: '0 0 6px',
            }}>
              {answer.isCorrect ? 'Correct' : 'Not quite — here\'s why'}
            </p>
            <p style={{ color: 'rgba(250,249,247,0.65)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
              {answer.explanation}
            </p>
          </div>
          <button
            type="button"
            onClick={handleNext}
            style={{
              backgroundColor: GOLD, color: '#0A0F18',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '11px 24px', borderRadius: '4px', border: 'none', cursor: 'pointer',
            }}
          >
            {isLast ? 'See Results' : 'Next Question →'}
          </button>
        </div>
      )}
    </div>
  )
}
