'use client'

import { useState, useEffect, useRef } from 'react'

const BLUE = '#60A5FA'

interface Props {
  courseId: string
}

export function NotToDoTool({ courseId }: Props) {
  const [items, setItems] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/strategic-plans?course_id=${encodeURIComponent(courseId)}&domain=not-to-do`)
      .then(r => r.json())
      .then(({ plans }) => {
        const plan = plans?.[0]
        const saved = plan?.content?.items
        if (Array.isArray(saved)) setItems(saved)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [courseId])

  async function persist(updatedItems: string[]) {
    setSaving(true)
    try {
      await fetch('/api/strategic-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          domain: 'not-to-do',
          content: { items: updatedItems },
        }),
      })
    } catch (e) {
      console.error('[NotToDoTool] persist error', e)
    } finally {
      setSaving(false)
    }
  }

  async function addItem() {
    const trimmed = input.trim()
    if (!trimmed || saving) return
    const updated = [...items, trimmed]
    setItems(updated)
    setInput('')
    await persist(updated)
  }

  async function deleteItem(index: number) {
    const updated = items.filter((_, i) => i !== index)
    setItems(updated)
    await persist(updated)
  }

  return (
    <div
      style={{
        backgroundColor: '#111926',
        border: '1px solid rgba(96,165,250,0.15)',
        borderRadius: '8px',
        padding: '28px 28px 24px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h3
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 900,
            fontSize: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#faf9f7',
            margin: '0 0 6px',
          }}
        >
          My Not-To-Do List
        </h3>
        <p style={{ color: 'rgba(250,249,247,0.4)', fontSize: '14px', margin: 0 }}>
          Protecting your WIG focus means saying no to these.
        </p>
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addItem() }}
          placeholder="What will you stop doing?"
          style={{
            flex: 1,
            backgroundColor: '#0A0F18',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            padding: '10px 14px',
            color: '#faf9f7',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          onClick={addItem}
          disabled={!input.trim() || saving}
          style={{
            backgroundColor: input.trim() && !saving ? BLUE : 'rgba(96,165,250,0.2)',
            color: input.trim() && !saving ? '#0A0F18' : 'rgba(96,165,250,0.4)',
            border: 'none',
            borderRadius: '4px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '10px 20px',
            cursor: input.trim() && !saving ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s, color 0.15s',
            flexShrink: 0,
          }}
        >
          {saving ? '…' : 'Add'}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p
          style={{
            color: 'rgba(250,249,247,0.25)',
            fontSize: '13px',
            textAlign: 'center',
            padding: '16px 0',
          }}
        >
          Loading…
        </p>
      ) : items.length === 0 ? (
        <p
          style={{
            color: 'rgba(250,249,247,0.25)',
            fontSize: '14px',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '20px 0',
            margin: 0,
          }}
        >
          You haven&apos;t committed to anything yet. What will you stop doing?
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {items.map((item, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#0A0F18',
                borderLeft: `3px solid ${BLUE}`,
                borderRadius: '0 4px 4px 0',
                padding: '10px 12px 10px 16px',
              }}
            >
              <span
                style={{
                  color: 'rgba(250,249,247,0.85)',
                  fontSize: '14px',
                  lineHeight: 1.4,
                  flex: 1,
                  marginRight: '12px',
                }}
              >
                {item}
              </span>
              <button
                onClick={() => deleteItem(i)}
                aria-label="Remove item"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(250,249,247,0.25)',
                  fontSize: '20px',
                  lineHeight: 1,
                  padding: '0',
                  flexShrink: 0,
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(250,249,247,0.25)' }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
