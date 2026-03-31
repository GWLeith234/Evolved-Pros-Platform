'use client'

import { useState, useEffect } from 'react'

interface Props {
  pillarId: string
  courseId: string
  promptText: string
}

interface SavedReflection {
  id: string
  body: string
  created_at: string
}

export function ReflectionPrompt({ courseId, promptText }: Props) {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState<SavedReflection | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load existing reflection for this course on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/reflections?course_id=${encodeURIComponent(courseId)}`)
        if (res.ok) {
          const json = await res.json() as { reflections: SavedReflection[] }
          if (json.reflections.length > 0) {
            setSaved(json.reflections[0])
            setText(json.reflections[0].body)
          }
        }
      } catch {
        // silently ignore — user can still write a new reflection
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId])

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, body: text }),
      })
      const json = await res.json() as SavedReflection & { error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Failed to save reflection')
        return
      }
      setSaved(json)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = text.trim().length >= 50 && !saved && !submitting

  return (
    <div
      style={{
        backgroundColor: '#111926',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '8px',
        padding: '28px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p
          style={{
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
            color: '#C9A84C', margin: '0 0 8px',
          }}
        >
          Reflection
        </p>
        <p style={{ color: 'rgba(250,249,247,0.75)', fontSize: '15px', lineHeight: 1.6, margin: 0 }}>
          {promptText}
        </p>
      </div>

      {loading ? (
        <div style={{ height: '120px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)' }} />
      ) : saved ? (
        // Saved state
        <div>
          <div
            style={{
              backgroundColor: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.18)',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '12px',
            }}
          >
            <p style={{ color: 'rgba(250,249,247,0.8)', fontSize: '14px', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>
              {saved.body}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span
              style={{
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase',
                color: '#C9A84C',
              }}
            >
              Reflection saved
            </span>
            <span style={{ color: 'rgba(250,249,247,0.25)', fontSize: '11px', marginLeft: '4px' }}>
              {new Date(saved.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ) : (
        // Input state
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your reflection here... (minimum 50 characters)"
            rows={5}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.04)',
              border: `1px solid ${text.length >= 50 ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '4px',
              color: '#faf9f7',
              fontSize: '14px',
              lineHeight: 1.65,
              padding: '14px',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
            <span
              style={{
                fontSize: '11px', fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 600, color: text.length >= 50 ? 'rgba(250,249,247,0.3)' : 'rgba(250,249,247,0.2)',
              }}
            >
              {text.trim().length < 50 ? `${50 - text.trim().length} more characters needed` : ''}
            </span>
            {error && (
              <span style={{ fontSize: '12px', color: '#ef0e30' }}>{error}</span>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                backgroundColor: canSubmit ? '#C9A84C' : 'rgba(201,168,76,0.2)',
                color: canSubmit ? '#0A0F18' : 'rgba(201,168,76,0.4)',
                fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
                fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
                padding: '10px 24px', borderRadius: '4px', border: 'none',
                cursor: canSubmit ? 'pointer' : 'default', transition: 'all 0.2s',
              }}
            >
              {submitting ? 'Saving…' : 'Save Reflection'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
