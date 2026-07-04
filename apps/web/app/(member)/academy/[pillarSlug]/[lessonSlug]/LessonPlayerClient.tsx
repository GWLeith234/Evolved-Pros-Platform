'use client'

import { useEffect, useState } from 'react'
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
/**
 * Build an embed URL carrying start-time hints. HeyGen publishes no seek API
 * for /embeds/ iframes, so this is best-effort: `t`/`start` query params plus
 * an HTML5 media-fragment hash, with autoplay so the reload resumes playback.
 * If HeyGen ignores all hints the video restarts from 0 — degraded but
 * deterministic. Precise seeking works on the Mux path (MuxPlayer listens
 * for the same `academy:seek` event and sets currentTime directly).
 */
function withStartTime(embedUrl: string, seconds: number): string {
  try {
    const url = new URL(embedUrl)
    url.searchParams.set('autoplay', '1')
    url.searchParams.set('t', String(seconds))
    url.searchParams.set('start', String(seconds))
    url.hash = `t=${seconds}`
    return url.toString()
  } catch {
    return embedUrl
  }
}

export function LessonPlayerClient({
  embedUrl,
  maxHeight,
  ...muxProps
}: LessonPlayerClientProps) {
  // Transcript rows dispatch `academy:seek` (see LessonLayer). For the
  // iframe branch we reload the embed with start-time hints; a state-driven
  // src keeps React owning the attribute.
  const [frameSrc, setFrameSrc] = useState<string | null>(embedUrl ?? null)
  useEffect(() => setFrameSrc(embedUrl ?? null), [embedUrl])
  useEffect(() => {
    if (!embedUrl) return
    const onSeek = (e: Event) => {
      const seconds = (e as CustomEvent<{ seconds?: unknown }>).detail?.seconds
      if (typeof seconds !== 'number' || !Number.isFinite(seconds)) return
      setFrameSrc(withStartTime(embedUrl, Math.max(0, Math.floor(seconds))))
    }
    window.addEventListener('academy:seek', onSeek as EventListener)
    return () => window.removeEventListener('academy:seek', onSeek as EventListener)
  }, [embedUrl])

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
          // key forces a real reload when only the hash portion changes —
          // browsers treat same-URL-different-hash as an in-page navigation.
          key={frameSrc ?? embedUrl}
          src={frameSrc ?? embedUrl}
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
