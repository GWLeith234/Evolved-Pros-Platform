'use client'

import { useState, useEffect } from 'react'

const CRIMSON = '#F87171'
const GOLD = '#C9A84C'

interface Commitment {
  id: string
  commitment: string
  is_completed: boolean
  completed_at: string | null
}

interface Props {
  courseId?: string
  weekStart: string // YYYY-MM-DD — Monday of current week
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(start)} — ${fmt(end)}`
}

export function CommitmentTracker({ courseId, weekStart }: Props) {
  const [savedCommitments, setSavedCommitments] = useState<Commitment[]>([])
  const [inputs, setInputs] = useState(['', '', ''])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/commitments?week_start=${encodeURIComponent(weekStart)}`)
      .then(r => r.json())
      .then((data: { commitments?: Commitment[] }) => {
        if (data.commitments?.length) setSavedCommitments(data.commitments)
      })
      .catch(() => {/* ignore */})
      .finally(() => setLoading(false))
  }, [weekStart])

  async function handleSave() {
    const filled = inputs.filter(s => s.trim().length > 0)
    if (!filled.length || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start: weekStart, commitments: filled, course_id: courseId ?? null }),
      })
      const json = await res.json() as { commitments?: Commitment[]; error?: string }
      if (res.ok && json.commitments) {
        setSavedCommitments(json.commitments)
        setInputs(['', '', ''])
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(commitment: Commitment) {
    if (togglingId === commitment.id) return
    setTogglingId(commitment.id)
    const next = !commitment.is_completed
    try {
      const res = await fetch(`/api/commitments/${commitment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: next }),
      })
      if (res.ok) {
        setSavedCommitments(prev =>
          prev.map(c =>
            c.id === commitment.id
              ? { ...c, is_completed: next, completed_at: next ? new Date().toISOString() : null }
              : c
          )
        )
      }
    } finally {
      setTogglingId(null)
    }
  }

  const completedCount = savedCommitments.filter(c => c.is_completed).length
  const hasSaved = savedCommitments.length > 0

  return (
    <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: GOLD, margin: '0 0 2px',
        }}>
          This Week&apos;s Commitments
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ color: 'rgba(250,249,247,0.35)', fontSize: '12px', margin: 0 }}>
            {formatWeekRange(weekStart)}
          </p>
          {hasSaved && (
            <span style={{
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
              color: completedCount === savedCommitments.length ? CRIMSON : 'rgba(250,249,247,0.3)',
            }}>
              {completedCount} / {savedCommitments.length}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(250,249,247,0.2)', fontSize: '12px', fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Loading…
        </p>
      ) : hasSaved ? (
        /* Saved state — show as checkable items */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {savedCommitments.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleToggle(c)}
              disabled={togglingId === c.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                cursor: 'pointer', padding: '8px 0',
              }}
            >
              {/* Checkbox */}
              <div style={{
                flexShrink: 0, width: '20px', height: '20px', borderRadius: '4px',
                backgroundColor: c.is_completed ? CRIMSON : 'transparent',
                border: `2px solid ${c.is_completed ? CRIMSON : 'rgba(255,255,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {c.is_completed && (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2 5.5L4.5 8L9 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {/* Text */}
              <span style={{
                fontSize: '13px', lineHeight: 1.5,
                color: c.is_completed ? 'rgba(250,249,247,0.3)' : 'rgba(250,249,247,0.8)',
                textDecoration: c.is_completed ? 'line-through' : 'none',
                transition: 'all 0.15s',
              }}>
                {c.commitment}
              </span>
            </button>
          ))}

          {/* New week link */}
          <button
            type="button"
            onClick={() => setSavedCommitments([])}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'rgba(250,249,247,0.2)', padding: '8px 0 0', textAlign: 'left',
            }}
          >
            + Set new commitments
          </button>
        </div>
      ) : (
        /* Input form */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {inputs.map((val, i) => (
            <input
              key={i}
              type="text"
              value={val}
              onChange={e => {
                const next = [...inputs]
                next[i] = e.target.value
                setInputs(next)
              }}
              onKeyDown={e => { if (e.key === 'Enter' && i === inputs.length - 1) handleSave() }}
              placeholder={`Commitment ${i + 1}…`}
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: `1px solid ${val.trim() ? CRIMSON + '33' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '4px', padding: '9px 12px',
                color: '#faf9f7', fontSize: '13px', outline: 'none',
                fontFamily: 'inherit', transition: 'border-color 0.2s',
              }}
            />
          ))}
          <button
            type="button"
            onClick={handleSave}
            disabled={!inputs.some(s => s.trim()) || saving}
            style={{
              backgroundColor: inputs.some(s => s.trim()) ? GOLD : 'rgba(255,255,255,0.05)',
              color: inputs.some(s => s.trim()) ? '#0A0F18' : 'rgba(255,255,255,0.2)',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '10px', borderRadius: '4px', border: 'none',
              cursor: inputs.some(s => s.trim()) ? 'pointer' : 'default',
              marginTop: '4px', transition: 'all 0.15s',
            }}
          >
            {saving ? 'Saving…' : 'Save Commitments'}
          </button>
        </div>
      )}
    </div>
  )
}
