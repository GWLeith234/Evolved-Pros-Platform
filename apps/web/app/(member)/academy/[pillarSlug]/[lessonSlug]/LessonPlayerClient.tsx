'use client'

import { DynamicMuxPlayer } from '@/components/academy/DynamicMuxPlayer'

interface LessonPlayerClientProps {
  playbackId: string
  token: string | null
  initialProgress: number
  lessonId: string
  lessonNumber: number
  totalLessons: number
  courseTitle: string
}

/**
 * Client-side wrapper around <DynamicMuxPlayer />. Exists solely so the
 * lesson server component never has to pass an event handler (onComplete)
 * across the RSC boundary — Next.js 14 App Router forbids that, and the
 * violation surfaces in production as React digest 900485783
 * ("Event handlers cannot be passed to Client Component props.").
 *
 * Lesson completion is recorded server-side via the progress API when the
 * player advances past the watch threshold; no client-side bookkeeping
 * needed here, so the handler is intentionally a no-op. Future event
 * handlers (onProgress, onError, …) belong in this file.
 */
export function LessonPlayerClient(props: LessonPlayerClientProps) {
  return (
    <DynamicMuxPlayer
      {...props}
      onComplete={() => {
        // intentional no-op
      }}
    />
  )
}
