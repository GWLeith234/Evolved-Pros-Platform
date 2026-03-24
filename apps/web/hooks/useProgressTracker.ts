'use client'

import { useCallback, useEffect, useRef } from 'react'

export function useProgressTracker(lessonId: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const latestTime = useRef(0)

  const saveProgress = useCallback((currentTime: number) => {
    latestTime.current = currentTime
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchTimeSeconds: latestTime.current }),
      })
    }, 10_000)
  }, [lessonId])

  // Save on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
      if (latestTime.current > 0) {
        void fetch(`/api/lessons/${lessonId}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ watchTimeSeconds: latestTime.current }),
          keepalive: true,
        })
      }
    }
  }, [lessonId])

  return { saveProgress }
}
