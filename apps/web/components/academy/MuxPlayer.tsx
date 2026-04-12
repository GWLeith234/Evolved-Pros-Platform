'use client'
import MuxPlayerElement from '@mux/mux-player-react'
import { useEffect, useRef, useCallback, useState } from 'react'

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

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Resume from saved position
  useEffect(() => {
    if (!playerRef.current || !initialProgress) return
    const el = playerRef.current
    const setTime = () => { el.currentTime = initialProgress }
    el.addEventListener('loadedmetadata', setTime, { once: true })
    return () => el.removeEventListener('loadedmetadata', setTime)
  }, [initialProgress])

  const saveProgress = useCallback(async (currentTime: number, completed = false) => {
    setSaveStatus('saving')
    let lastError: unknown
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`/api/lessons/${lessonId}/progress`, {
          method:    'POST',
          headers:   { 'Content-Type': 'application/json' },
          body:      JSON.stringify({ watchTimeSeconds: Math.floor(currentTime), completed }),
          keepalive: true,
        })
        if (res.ok) {
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus('idle'), 2000)
          return
        }
        lastError = new Error(`HTTP ${res.status}`)
      } catch (err) {
        lastError = err
      }
      // Exponential backoff: 1s, 2s, 4s
      if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * 2 ** attempt))
    }
    console.error('[MuxPlayer] Failed to save progress after 3 retries:', lastError)
    setSaveStatus('error')
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

  // Save on unmount / tab close
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveProgress(latestTimeRef.current)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
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
      {/* Save status indicator */}
      {saveStatus !== 'idle' && (
        <div style={{
          position:      'absolute',
          top:           12,
          right:         16,
          fontFamily:    'sans-serif',
          fontSize:      10,
          fontWeight:    600,
          color:         saveStatus === 'error' ? '#ef0e30' : 'rgba(255,255,255,0.5)',
          pointerEvents: 'none',
        }}>
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved'}
          {saveStatus === 'error' && 'Progress not saved — check connection'}
        </div>
      )}
    </div>
  )
}
