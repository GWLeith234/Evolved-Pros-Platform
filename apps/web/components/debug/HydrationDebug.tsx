'use client'
import { useEffect } from 'react'

export function HydrationDebug() {
  useEffect(() => {
    const h = (e: ErrorEvent) => {
      if (e.message?.includes('425') || e.message?.includes('hydrat')) {
        console.error('[HYD]', e.error?.stack ?? e.message)
      }
    }
    window.addEventListener('error', h)
    return () => window.removeEventListener('error', h)
  }, [])
  return null
}
