'use client'

import { DynamicMuxPlayer } from '@/components/academy/DynamicMuxPlayer'

interface LessonPlayerClientProps {
  /** HeyGen (or other) iframe embed URL. Takes precedence over Mux. */
  embedUrl?: string | null
  playbackId: string
  token: string | null
  initialProgress: number
  lessonId: string
  lessonNumber: number
  totalLessons: number
  courseTitle: string
  /** Optional height cap (px). Pass a larger value or omit for full-width. */
  maxHeight?: number
}

/**
 * Client-side wrapper around the lesson video player.
 *
 * Renders a HeyGen-style iframe when `embedUrl` is set, otherwise falls back
 * to <DynamicMuxPlayer />. Exists so the lesson server component never has to
 * pass an event handler (onComplete) across the RSC boundary — Next.js 14
 * App Router forbids that, and the violation surfaces in production as React
 * digest 900485783 ("Event handlers cannot be passed to Client Component
 * props.").
 */
export function LessonPlayerClient({
  embedUrl,
  maxHeight,
  ...muxProps
}: LessonPlayerClientProps) {
  if (embedUrl) {
    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 9',
          maxHeight,
          background: '#000',
          overflow: 'hidden',
        }}
      >
        <iframe
          src={embedUrl}
          title={muxProps.courseTitle}
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 0,
          }}
        />
      </div>
    )
  }

  return (
    <DynamicMuxPlayer
      {...muxProps}
      maxHeight={maxHeight}
      onComplete={() => {
        // intentional no-op
      }}
    />
  )
}
