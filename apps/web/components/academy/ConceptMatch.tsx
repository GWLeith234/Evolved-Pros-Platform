'use client'

import { useState, useEffect, useCallback } from 'react'

const GOLD  = '#C9A84C'
const TEAL  = '#0ABFA3'
const RED   = '#ef0e30'

interface Pair { id: string; term: string; definition: string }
interface Card { id: string; text: string }

interface Props {
  courseId: string
  pairs: Pair[]
  title?: string
}

type Selection = { type: 'term' | 'def'; id: string } | null

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function fmtElapsed(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

export function ConceptMatch({ courseId, pairs, title }: Props) {
  const [terms, setTerms]         = useState<Card[]>([])
  const [defs, setDefs]           = useState<Card[]>([])
  const [selected, setSelected]   = useState<Selection>(null)
  const [matched, setMatched]     = useState<Set<string>>(new Set())
  const [flashWrong, setFlashWrong] = useState<{ termId: string; defId: string } | null>(null)
  const [wrongCount, setWrongCount] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsed, setElapsed]     = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const complete = matched.size === pairs.length && pairs.length > 0

  const deal = useCallback(() => {
    setTerms(shuffle(pairs.map(p => ({ id: p.id, text: p.term }))))
    setDefs(shuffle(pairs.map(p => ({ id: p.id, text: p.definition }))))
  }, [pairs])

  useEffect(() => { deal() }, [deal])

  function resetGame() {
    deal()
    setSelected(null)
    setMatched(new Set())
    setFlashWrong(null)
    setWrongCount(0)
    setStartTime(null)
    setElapsed(null)
    setSubmitted(false)
    setSaveError(null)
  }

  function handleClick(type: 'term' | 'def', id: string) {
    if (complete) return
    if (matched.has(id)) return   // already matched, ignore
    if (flashWrong) return        // mid-flash, ignore

    // Record first interaction time
    const now = Date.now()
    if (!startTime) setStartTime(now)

    // If clicking same type as currently selected → change selection
    if (selected?.type === type) {
      setSelected(id === selected.id ? null : { type, id })
      return
    }

    // If nothing selected yet
    if (!selected) {
      setSelected({ type, id })
      return
    }

    // We have a selection of the opposite type → check match
    const termId = type === 'term' ? id : selected.id
    const defId  = type === 'def'  ? id : selected.id

    if (termId === defId) {
      // Correct match
      setMatched(prev => {
        const next = new Set(prev).add(termId)
        if (next.size === pairs.length) {
          setElapsed(Date.now() - (startTime ?? now))
        }
        return next
      })
      setSelected(null)
    } else {
      // Wrong — flash red then reset
      setFlashWrong({ termId, defId })
      setWrongCount(c => c + 1)
      setTimeout(() => {
        setFlashWrong(null)
        setSelected(null)
      }, 650)
    }
  }

  async function handleSave() {
    if (!complete || submitting) return
    setSubmitting(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/checkin-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id:    courseId,
          module_number: 1,
          checkin_type: 'concept-match',
          score:        pairs.length,
          max_score:    pairs.length,
          result_json:  { matched: pairs.length, wrong_attempts: wrongCount, elapsed_ms: elapsed },
        }),
      })
      if (res.ok) {
        setSubmitted(true)
      } else {
        const json = await res.json().catch(() => ({})) as { error?: string }
        setSaveError(json.error ?? 'Failed to save score')
      }
    } catch {
      setSaveError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = terms.length === 0

  /* ── COMPLETION SCREEN ─────────────────────────────────────── */
  if (complete) {
    const accuracy = wrongCount === 0
      ? 'Perfect — no wrong attempts.'
      : wrongCount === 1
      ? '1 wrong attempt before matching all pairs.'
      : `${wrongCount} wrong attempts before matching all pairs.`

    return (
      <div style={surfaceCard}>
        <p style={eyebrow}>{title ?? 'Concept Match'}</p>
        <div style={{ textAlign: 'center', padding: '12px 0 24px' }}>
          <p style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900, fontSize: 'clamp(28px, 5vw, 42px)', color: TEAL, margin: '0 0 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {pairs.length} / {pairs.length} — All Matched
          </p>
          {elapsed !== null && (
            <p style={{ color: 'rgba(250,249,247,0.45)', fontSize: '14px', margin: '0 0 4px' }}>
              Time: <strong style={{ color: GOLD }}>{fmtElapsed(elapsed)}</strong>
            </p>
          )}
          <p style={{ color: 'rgba(250,249,247,0.35)', fontSize: '13px', margin: 0 }}>{accuracy}</p>
        </div>

        {/* Matched pairs recap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          {pairs.map(p => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '8px 12px', backgroundColor: `${TEAL}0A`, border: `1px solid ${TEAL}22`, borderRadius: '4px' }}>
              <span style={{ color: TEAL, fontSize: '13px', fontWeight: 600 }}>{p.term}</span>
              <span style={{ color: 'rgba(250,249,247,0.6)', fontSize: '13px' }}>{p.definition}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {!submitted && (
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              style={{
                backgroundColor: GOLD, color: '#0A0F18',
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '10px 24px', borderRadius: '4px', border: 'none',
                cursor: submitting ? 'default' : 'pointer',
              }}
            >
              {submitting ? 'Saving…' : 'Save Score'}
            </button>
          )}
          {submitted && (
            <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: TEAL }}>
              ✓ Score Saved
            </span>
          )}
          {saveError && !submitted && (
            <span style={{ fontSize: '12px', color: RED }}>{saveError}</span>
          )}
          <button
            type="button"
            onClick={resetGame}
            style={ghostBtn}
          >
            Play Again
          </button>
        </div>
      </div>
    )
  }

  /* ── GAME BOARD ────────────────────────────────────────────── */
  const matchedCount = matched.size

  return (
    <div style={surfaceCard}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p style={eyebrow}>{title ?? 'Concept Match'}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', margin: 0 }}>
            Match each term to its definition.
          </p>
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.1em', color: matchedCount > 0 ? TEAL : 'rgba(250,249,247,0.25)' }}>
            {matchedCount} / {pairs.length} matched
          </span>
        </div>
      </div>

      {isLoading ? (
        <p style={{ color: 'rgba(250,249,247,0.2)', fontSize: '12px', fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Loading…
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Terms column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={colHeader}>Terms</p>
            {terms.map(t => {
              const isMatched  = matched.has(t.id)
              const isSelected = selected?.type === 'term' && selected.id === t.id
              const isWrong    = flashWrong?.termId === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleClick('term', t.id)}
                  disabled={isMatched}
                  style={cardStyle({ isMatched, isSelected, isWrong, isDisabled: isMatched })}
                >
                  {t.text}
                </button>
              )
            })}
          </div>

          {/* Definitions column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <p style={colHeader}>Definitions</p>
            {defs.map(d => {
              const isMatched  = matched.has(d.id)
              const isSelected = selected?.type === 'def' && selected.id === d.id
              const isWrong    = flashWrong?.defId === d.id
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleClick('def', d.id)}
                  disabled={isMatched}
                  style={cardStyle({ isMatched, isSelected, isWrong, isDisabled: isMatched })}
                >
                  {d.text}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── shared micro-styles ──────────────────────────────────────── */

const surfaceCard: React.CSSProperties = {
  backgroundColor: '#111926',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '8px',
  padding: '28px',
}

const eyebrow: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: GOLD,
  margin: '0 0 4px',
}

const colHeader: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(250,249,247,0.25)',
  margin: '0 0 2px',
}

const ghostBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'rgba(250,249,247,0.3)',
  padding: 0,
}

function cardStyle({ isMatched, isSelected, isWrong, isDisabled }: {
  isMatched: boolean
  isSelected: boolean
  isWrong: boolean
  isDisabled: boolean
}): React.CSSProperties {
  let borderColor = 'rgba(255,255,255,0.08)'
  let bgColor     = 'rgba(255,255,255,0.02)'
  let color       = 'rgba(250,249,247,0.75)'
  let cursor: React.CSSProperties['cursor'] = 'pointer'

  if (isMatched) {
    borderColor = `${TEAL}44`
    bgColor     = `${TEAL}12`
    color       = TEAL
    cursor      = 'default'
  } else if (isWrong) {
    borderColor = `${RED}66`
    bgColor     = `rgba(239,14,48,0.08)`
    color       = '#faf9f7'
  } else if (isSelected) {
    borderColor = `${GOLD}88`
    bgColor     = `${GOLD}12`
    color       = '#faf9f7'
  }

  return {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '12px 14px',
    borderRadius: '6px',
    border: `1px solid ${borderColor}`,
    backgroundColor: bgColor,
    color,
    fontSize: '13px',
    lineHeight: 1.45,
    cursor: isDisabled ? 'default' : cursor,
    transition: 'border-color 0.15s, background-color 0.15s',
    fontFamily: 'inherit',
    minHeight: '52px',
  }
}
