'use client'

import { useState } from 'react'
import { TileCard } from './tiles/TileCard'
import { TileFooterLink } from './tiles/TileRow'
import type { GoalForCard } from './GoalCard'

const GOLD = '#C9A84C'

/**
 * Lag measures = the OUTCOMES you're driving (quarterly goals). Shows a live
 * progress bar per goal and a one-tap quick-log so members can move the number
 * without leaving Home. Lead measures (daily habits) drive these.
 */
export function LagMeasures({ goals: initial }: { goals: GoalForCard[] }) {
  const [goals, setGoals] = useState(initial)
  const [openId, setOpenId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState<string | null>(null)

  async function logProgress(id: string) {
    const pct = Math.max(0, Math.min(100, Math.round(Number(draft))))
    if (!Number.isFinite(pct)) { setOpenId(null); return }
    setPending(id)
    const prev = goals
    setGoals(list => list.map(g => {
      if (g.id !== id) return g
      return { ...g, weekly_delta: pct - g.progress_pct, progress_pct: pct }
    }))
    setOpenId(null)
    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress_pct: pct }),
      })
      if (!res.ok) setGoals(prev)
    } catch {
      setGoals(prev)
    } finally {
      setPending(null)
    }
  }

  return (
    <TileCard
      accent={GOLD}
      eyebrow="Outcomes"
      title="Lag measures"
      footer={<TileFooterLink href="/home#today">Reflect on the quarter</TileFooterLink>}
    >
      <div style={{ padding: '4px 16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {goals.length === 0 ? (
          <p style={{ margin: '8px 0', fontSize: 12, color: 'var(--text-tertiary)', fontFamily: '"Barlow", sans-serif' }}>
            No outcome goals yet — set the results your daily reps are driving toward.
          </p>
        ) : (
          goals.map(g => {
            const done = g.progress_pct >= 100
            const isOpen = openId === g.id
            return (
              <div key={g.id}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{
                    fontFamily: '"Barlow", sans-serif', fontWeight: 600, fontSize: 13,
                    color: 'var(--text-primary)', lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{g.title}</span>
                  <span style={{
                    flexShrink: 0, fontFamily: '"Bebas Neue", sans-serif', fontSize: 20,
                    letterSpacing: '0.02em', color: done ? '#22c55e' : GOLD,
                  }}>{g.progress_pct}%</span>
                </div>

                <div style={{ height: 5, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden', margin: '6px 0 4px' }}>
                  <div
                    className={`ep-progress-fill${done ? ' ep-progress-fill--done' : ''}`}
                    style={{
                      height: '100%', borderRadius: 99, width: `${g.progress_pct}%`,
                      background: done ? '#22c55e' : GOLD,
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      ...({ ['--ep-glow']: 'rgba(34,197,94,0.7)' } as any),
                    }}
                  />
                </div>

                {isOpen ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <input
                      type="number" min={0} max={100} autoFocus
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') void logProgress(g.id); if (e.key === 'Escape') setOpenId(null) }}
                      style={{
                        width: 64, padding: '4px 8px', fontSize: 13, fontFamily: '"Barlow", sans-serif',
                        background: 'var(--bg-page)', color: 'var(--text-primary)',
                        border: '1px solid var(--border-color)', borderRadius: 6,
                      }}
                    />
                    <button
                      type="button" onClick={() => void logProgress(g.id)} disabled={pending === g.id}
                      style={qa(GOLD, true)}
                    >Save</button>
                    <button type="button" onClick={() => setOpenId(null)} style={qa('var(--text-tertiary)', false)}>Cancel</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setOpenId(g.id); setDraft(String(g.progress_pct)) }}
                    style={{
                      marginTop: 2, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 11,
                      letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD,
                    }}
                  >
                    {g.weekly_delta !== 0 && (
                      <span style={{ color: g.weekly_delta < 0 ? '#ef0e30' : '#22c55e', marginRight: 6 }}>
                        {g.weekly_delta > 0 ? '▲' : '▼'}{Math.abs(g.weekly_delta)}%
                      </span>
                    )}
                    Log progress →
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </TileCard>
  )
}

function qa(color: string, filled: boolean): React.CSSProperties {
  return {
    fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 11,
    letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 6,
    cursor: 'pointer', color: filled ? '#fff' : color,
    background: filled ? '#C9A84C' : 'transparent',
    border: `1px solid ${filled ? '#C9A84C' : 'var(--border-color)'}`,
  }
}
