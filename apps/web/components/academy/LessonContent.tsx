'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LessonTabs } from './LessonTabs'
import type { LessonWithProgress } from '@/lib/academy/types'

interface LessonContentProps {
  lesson: LessonWithProgress & { title: string; description: string | null }
  courseSlug: string
  nextLessonSlug: string | null
  initialNotes: string
  isCompleted: boolean
}

export function LessonContent({
  lesson,
  courseSlug,
  nextLessonSlug,
  initialNotes,
  isCompleted: initialCompleted,
}: LessonContentProps) {
  const router = useRouter()
  const [completed, setCompleted] = useState(initialCompleted)
  const [marking, setMarking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMarkComplete() {
    if (completed || marking) return
    setMarking(true)
    setError(null)
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchTimeSeconds: lesson.watchTimeSeconds, completed: true }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to mark complete')
      }
      setCompleted(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="px-7 py-6">
      {/* Eyebrow */}
      <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1" style={{ color: '#68a2b9' }}>
        Now Playing
      </p>
      <h1
        className="font-display font-bold leading-tight mb-3"
        style={{ fontSize: '20px', color: '#112535' }}
      >
        {lesson.title}
      </h1>
      {lesson.description && (
        <p
          className="font-body text-[14px] leading-[1.7] mb-5"
          style={{ color: '#7a8a96' }}
        >
          {lesson.description}
        </p>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <LessonTabs lessonId={lesson.id} initialNotes={initialNotes} />
      </div>

      {/* Action buttons */}
      {error && (
        <p className="font-condensed text-[11px] text-[#ef0e30] mb-3">{error}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleMarkComplete}
          disabled={completed || marking}
          className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-4 py-3 transition-all"
          style={{
            backgroundColor: completed ? '#22c55e' : '#ef0e30',
            color: 'white',
            opacity: marking ? 0.7 : 1,
          }}
        >
          {marking ? 'Saving…' : completed ? 'Completed ✓' : 'Mark Complete →'}
        </button>
        {nextLessonSlug ? (
          <a
            href={`/academy/${courseSlug}/${nextLessonSlug}`}
            className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-4 py-3 text-center transition-all"
            style={{ color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'transparent' }}
          >
            Next Lesson →
          </a>
        ) : (
          <a
            href={`/academy/${courseSlug}`}
            className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-4 py-3 text-center transition-all"
            style={{ color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'transparent' }}
          >
            Back to Course →
          </a>
        )}
      </div>
    </div>
  )
}
