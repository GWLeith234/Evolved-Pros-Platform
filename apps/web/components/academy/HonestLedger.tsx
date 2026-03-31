'use client'

import { useState, useEffect } from 'react'

interface LedgerEntry {
  id: string
  column_type: 'built' | 'burned'
  content: string
  created_at: string
}

interface Props {
  courseId: string
}

const TEAL = '#0ABFA3'
const RED = '#C9302A'
const GOLD = '#C9A84C'

export function HonestLedger({ courseId }: Props) {
  const [entries, setEntries] = useState<LedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [builtInput, setBuiltInput] = useState('')
  const [burnedInput, setBurnedInput] = useState('')
  const [addingBuilt, setAddingBuilt] = useState(false)
  const [addingBurned, setAddingBurned] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/ledger?course_id=${encodeURIComponent(courseId)}`)
      .then(r => r.json())
      .then((data: { entries?: LedgerEntry[]; error?: string }) => {
        if (data.entries) setEntries(data.entries)
      })
      .catch(() => {/* ignore */})
      .finally(() => setLoading(false))
  }, [courseId])

  async function addEntry(columnType: 'built' | 'burned', content: string, clearFn: () => void) {
    const trimmed = content.trim()
    if (!trimmed) return
    if (columnType === 'built') setAddingBuilt(true)
    else setAddingBurned(true)
    try {
      const res = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, column_type: columnType, content: trimmed }),
      })
      const data = await res.json() as { entry?: LedgerEntry; error?: string }
      if (res.ok && data.entry) {
        setEntries(prev => [...prev, data.entry!])
        clearFn()
      }
    } finally {
      if (columnType === 'built') setAddingBuilt(false)
      else setAddingBurned(false)
    }
  }

  async function deleteEntry(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/ledger/${id}`, { method: 'DELETE' })
      if (res.ok) setEntries(prev => prev.filter(e => e.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const builtEntries = entries.filter(e => e.column_type === 'built')
  const burnedEntries = entries.filter(e => e.column_type === 'burned')

  return (
    <div style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '28px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
          fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: GOLD, margin: '0 0 4px',
        }}>
          Identity Tool
        </p>
        <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 6px' }}>
          The Honest Ledger
        </p>
        <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
          An honest accounting of your professional life. No filters — just truth.
        </p>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(250,249,247,0.25)', fontSize: '13px', fontFamily: '"Barlow Condensed", sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Loading…
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <LedgerColumn
            label="What I've Built"
            subLabel="Relationships · Reputation · Skills · Wins"
            color={TEAL}
            entries={builtEntries}
            inputValue={builtInput}
            adding={addingBuilt}
            deletingId={deletingId}
            onInputChange={setBuiltInput}
            onAdd={() => addEntry('built', builtInput, () => setBuiltInput(''))}
            onDelete={deleteEntry}
            placeholder="Add a win, skill, or relationship…"
          />
          <LedgerColumn
            label="What I've Burned"
            subLabel="Bridges · Trust · Opportunities · Time"
            color={RED}
            entries={burnedEntries}
            inputValue={burnedInput}
            adding={addingBurned}
            deletingId={deletingId}
            onInputChange={setBurnedInput}
            onAdd={() => addEntry('burned', burnedInput, () => setBurnedInput(''))}
            onDelete={deleteEntry}
            placeholder="Add a bridge burned, missed opportunity…"
          />
        </div>
      )}
    </div>
  )
}

function LedgerColumn({
  label, subLabel, color, entries, inputValue, adding, deletingId,
  onInputChange, onAdd, onDelete, placeholder,
}: {
  label: string
  subLabel: string
  color: string
  entries: LedgerEntry[]
  inputValue: string
  adding: boolean
  deletingId: string | null
  onInputChange: (v: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  placeholder: string
}) {
  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onAdd()
  }

  return (
    <div>
      {/* Column header */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{
          fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900,
          fontSize: '13px', letterSpacing: '0.18em', textTransform: 'uppercase',
          color, margin: '0 0 2px',
        }}>
          {label}
        </p>
        <p style={{ color: 'rgba(250,249,247,0.25)', fontSize: '11px', margin: 0, letterSpacing: '0.02em' }}>
          {subLabel}
        </p>
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <input
          type="text"
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          style={{
            flex: 1, backgroundColor: 'rgba(255,255,255,0.03)',
            border: `1px solid ${inputValue.trim() ? color + '44' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '4px', padding: '9px 12px',
            color: '#faf9f7', fontSize: '13px', outline: 'none',
            fontFamily: 'inherit', transition: 'border-color 0.2s',
          }}
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!inputValue.trim() || adding}
          style={{
            backgroundColor: inputValue.trim() ? GOLD : 'rgba(255,255,255,0.06)',
            color: inputValue.trim() ? '#0A0F18' : 'rgba(255,255,255,0.2)',
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '9px 16px', borderRadius: '4px', border: 'none',
            cursor: inputValue.trim() ? 'pointer' : 'default', transition: 'all 0.15s',
            flexShrink: 0,
          }}
        >
          {adding ? '…' : 'Add'}
        </button>
      </div>

      {/* Entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {entries.length === 0 ? (
          <p style={{
            color: 'rgba(250,249,247,0.18)', fontSize: '12px', fontStyle: 'italic',
            margin: '4px 0 0', lineHeight: 1.5,
          }}>
            Nothing here yet.
          </p>
        ) : (
          entries.map(entry => (
            <div
              key={entry.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px',
                backgroundColor: `${color}0A`,
                border: `1px solid ${color}1A`,
                borderRadius: '4px', padding: '8px 10px',
              }}
            >
              <span style={{ flex: 1, color: 'rgba(250,249,247,0.75)', fontSize: '13px', lineHeight: 1.5, wordBreak: 'break-word' }}>
                {entry.content}
              </span>
              <button
                type="button"
                onClick={() => onDelete(entry.id)}
                disabled={deletingId === entry.id}
                title="Remove"
                style={{
                  flexShrink: 0, background: 'none', border: 'none',
                  color: 'rgba(250,249,247,0.25)', cursor: 'pointer',
                  fontSize: '14px', lineHeight: 1, padding: '1px 2px',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = color)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(250,249,247,0.25)')}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
