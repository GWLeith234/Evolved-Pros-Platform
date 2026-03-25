'use client'
import MuxPlayerElement from '@mux/mux-player-react'
import { useEffect, useRef, useCallback } from 'react'

interface MuxPlayerProps {
  playbackId: string
  token: string | null
  initialProgress?: number
  lessonId: string
  lessonNumber: number
  totalLessons: number
  courseTitle: string
  onComplete?: () => void
}

export function MuxPlayer({
  playbackId,
  token,
  initialProgress = 0,
  lessonId,
  lessonNumber,
  totalLessons,
  courseTitle,
  onComplete,
}: MuxPlayerProps) {
  const playerRef = useRef<any>(null)
  const saveTimerRef = useRef<NodeJS.Timeout>()
  const latestTimeRef = useRef(initialProgress)
  const hasCompletedRef = useRef(false)

  // Resume from saved position
  useEffect(() => {
    if (!playerRef.current || !initialProgress) return
    const el = playerRef.current
    const setTime = () => { el.currentTime = initialProgress }
    el.addEventListener('loadedmetadata', setTime, { once: true })
    return () => el.removeEventListener('loadedmetadata', setTime)
  }, [initialProgress])

  const saveProgress = useCallback((currentTime: number, completed = false) => {
    fetch(`/api/lessons/${lessonId}/progress`, {
      method:    'POST',
      headers:   { 'Content-Type': 'application/json' },
      body:      JSON.stringify({ watchTimeSeconds: Math.floor(currentTime), completed }),
      keepalive: true,
    })
  }, [lessonId])

  // Debounced auto-save every 10 seconds
  const handleTimeUpdate = useCallback((e: any) => {
    const currentTime = e.target.currentTime
    latestTimeRef.current = currentTime
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveProgress(currentTime)
    }, 10_000)
  }, [saveProgress])

  // Auto-complete when 90% watched
  const handleTimeUpdateForCompletion = useCallback((e: any) => {
    if (hasCompletedRef.current) return
    const { currentTime, duration } = e.target
    if (duration && currentTime / duration > 0.9) {
      hasCompletedRef.current = true
      saveProgress(currentTime, true)
      onComplete?.()
    }
  }, [saveProgress, onComplete])

  // Save on unmount
  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current)
      saveProgress(latestTimeRef.current)
    }
  }, [saveProgress])

  if (!playbackId) {
    return (
      <div style={{
        background:    '#112535',
        aspectRatio:   '16/9',
        maxHeight:     420,
        display:       'flex',
        alignItems:    'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'sans-serif', fontSize: 14 }}>
          Video not yet available
        </p>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', background: '#112535', maxHeight: 420 }}>
      <MuxPlayerElement
        ref={playerRef}
        playbackId={playbackId}
        tokens={token ? { playback: token } : undefined}
        onTimeUpdate={(e: any) => {
          handleTimeUpdate(e)
          handleTimeUpdateForCompletion(e)
        }}
        accentColor="#ef0e30"
        style={{ width: '100%', aspectRatio: '16/9', maxHeight: 420 }}
        metadata={{
          video_title:    courseTitle,
          viewer_user_id: lessonId,
        }}
      />
      <div style={{
        position:      'absolute',
        top:           12,
        left:          16,
        fontFamily:    'sans-serif',
        fontSize:      10,
        fontWeight:    700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color:         'rgba(255,255,255,0.4)',
        pointerEvents: 'none',
      }}>
        Lesson {lessonNumber} of {totalLessons} · {courseTitle}
      </div>
    </div>
  )
}
