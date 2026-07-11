'use client'

import { useState } from 'react'
import { TileCard } from './tiles/TileCard'

const VIOLET = '#A78BFA'

export interface TimeBlock {
  id: string
  block_date: string
  start_time: string
  end_time: string | null
  label: string
  category: string | null
  completed: boolean
  sort_order: number
}

function byStart(a: TimeBlock, b: TimeBlock) {
  return a.start_time.localeCompare(b.start_time)
}

/** Time blocking for today — plan the day, then check blocks off as you go. */
export function TimeBlocks({ initial }: { initial: TimeBlock[] }) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([...initial].sort(byStart))
  const [start, setStart] = useState('')
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<string | null>(null)

  async function add() {
    if (!start || !label.trim() || busy) return
    setBusy(true)
    try {
      const res = await fetch('/api/member/time-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_time: start, label: label.trim() }),
      })
      const json = (await res.json().catch(() => ({}))) as { block?: TimeBlock; error?: string }
      if (res.ok && json.block) {
        setBlocks(list => [...list, json.block!].sort(byStart))
        setStart('')
        setLabel('')
      }
    } finally {
      setBusy(false)
    }
  }

  async function toggle(b: TimeBlock) {
    if (pending === b.id) return
    setPending(b.id)
    const next = !b.completed
    setBlocks(list => list.map(x => (x.id === b.id ? { ...x, completed: next } : x)))
    try {
      const res = await fetch(`/api/member/time-blocks/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: next }),
      })
      if (!res.ok) setBlocks(list => list.map(x => (x.id === b.id ? { ...x, completed: !next } : x)))
    } catch {
      setBlocks(list => list.map(x => (x.id === b.id ? { ...x, completed: !next } : x)))
    } finally {
      setPending(null)
    }
  }

  async function remove(id: string) {
    const prev = blocks
    setBlocks(list => list.filter(b => b.id !== id))
    try {
      const res = await fetch(`/api/member/time-blocks/${id}`, { method: 'DELETE' })
      if (!res.ok) setBlocks(prev)
    } catch {
      setBlocks(prev)
    }
  }

  const doneCount = blocks.filter(b => b.completed).length

  return (
    <TileCard
      accent={VIOLET}
      eyebrow="Time blocking"
      title="Today's plan"
    >
      <div style={{ padding: '2px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {blocks.length > 0 && (
          <p style={{
            margin: '0 0 2px', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-tertiary)',
          }}>{doneCount}/{blocks.length} blocks done</p>
        )}

        {blocks.length === 0 ? (
          <p style={{ margin: '4px 0', fontSize: 12, color: 'var(--text-tertiary)', fontFamily: '"Barlow", sans-serif' }}>
            Block your day — protect time for the work that moves your lead measures.
          </p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {blocks.map(b => (
              <li key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => void toggle(b)}
                  disabled={pending === b.id}
                  aria-label={b.completed ? 'Mark incomplete' : 'Mark complete'}
                  style={{
                    flexShrink: 0, width: 16, height: 16, borderRadius: 0, cursor: 'pointer',
                    background: b.completed ? VIOLET : 'transparent',
                    border: `2px solid ${b.completed ? VIOLET : 'var(--text-tertiary)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    transition: 'all 0.15s',
                  }}
                >
                  {b.completed && (
                    <svg width="9" height="9" viewBox="0 0 11 11" fill="none">
                      <path d="M2 5.5L4.5 8L9 3" stroke="#0A0F18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span style={{
                  flexShrink: 0, fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                  fontSize: 11, letterSpacing: '0.04em', color: 'var(--text-tertiary)', minWidth: 74,
                }}>
                  {b.start_time}{b.end_time ? `–${b.end_time}` : ''}
                </span>
                <span style={{
                  flex: 1, minWidth: 0, fontFamily: '"Barlow", sans-serif', fontSize: 13, lineHeight: 1.3,
                  color: b.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                  textDecoration: b.completed ? 'line-through' : 'none',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{b.label}</span>
                <button
                  type="button" onClick={() => void remove(b.id)} aria-label="Delete block"
                  style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 15, lineHeight: 1, padding: '0 2px' }}
                >×</button>
              </li>
            ))}
          </ul>
        )}

        {/* Quick add */}
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <input
            type="time" value={start} onChange={e => setStart(e.target.value)} aria-label="Start time"
            style={{
              width: 96, padding: '6px 8px', fontSize: 12, fontFamily: '"Barlow", sans-serif',
              background: 'var(--bg-page)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)', borderRadius: 6,
            }}
          />
          <input
            type="text" value={label} onChange={e => setLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void add() }}
            placeholder="Deep work…"
            style={{
              flex: 1, minWidth: 0, padding: '6px 8px', fontSize: 12, fontFamily: '"Barlow", sans-serif',
              background: 'var(--bg-page)', color: 'var(--text-primary)',
              border: '1px solid var(--border-color)', borderRadius: 6,
            }}
          />
          <button
            type="button" onClick={() => void add()} disabled={busy || !start || !label.trim()}
            style={{
              flexShrink: 0, padding: '6px 12px', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 6, cursor: 'pointer',
              color: '#fff', background: VIOLET, border: 'none',
              opacity: busy || !start || !label.trim() ? 0.5 : 1,
            }}
          >Add</button>
        </div>
      </div>
    </TileCard>
  )
}
