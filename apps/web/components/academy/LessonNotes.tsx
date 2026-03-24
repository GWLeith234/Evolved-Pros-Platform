'use client'

import { useState, useRef, useCallback } from 'react'

interface LessonNotesProps {
  lessonId: string
  initialNotes: string
}

export function LessonNotes({ lessonId, initialNotes }: LessonNotesProps) {
  const [notes, setNotes] = useState(initialNotes)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const handleChange = useCallback((value: string) => {
    setNotes(value)
    setSaveState('saving')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/lessons/${lessonId}/notes`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: value }),
        })
        if (res.ok) {
          setSaveState('saved')
          setTimeout(() => setSaveState('idle'), 2000)
        } else {
          setSaveState('idle')
        }
      } catch {
        setSaveState('idle')
      }
    }, 1500)
  }, [lessonId])

  return (
    <div
      className="rounded"
      style={{ backgroundColor: 'rgba(27,60,90,0.03)', border: '1px solid rgba(27,60,90,0.1)', padding: '14px 16px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px]" style={{ color: '#7a8a96' }}>
          Your Notes
        </p>
        {saveState !== 'idle' && (
          <span
            className="font-condensed text-[10px] transition-opacity"
            style={{
              color: '#68a2b9',
              opacity: saveState === 'saved' ? 1 : 0.5,
            }}
          >
            {saveState === 'saving' ? 'Saving…' : 'Saved'}
          </span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={e => handleChange(e.target.value)}
        maxLength={10000}
        rows={4}
        className="w-full font-body text-[13px] resize-none outline-none"
        style={{
          color: '#1b3c5a',
          backgroundColor: 'transparent',
          border: 'none',
          minHeight: '80px',
          lineHeight: 1.6,
        }}
        placeholder="Add your notes for this lesson…"
      />
    </div>
  )
}
