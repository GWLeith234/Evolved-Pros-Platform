'use client'

import { useEffect, useState } from 'react'

/**
 * Tracks the user's `prefers-reduced-motion` OS setting.
 *
 * SSR-safe: returns `false` on the server (assume motion OK so the
 * default rendering is identical to legacy behavior). After hydration,
 * the matchMedia value takes over.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

  return reduced
}
