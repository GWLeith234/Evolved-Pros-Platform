'use client'

/**
 * Polite ARIA live region for route / action announcements (Sprint 4B).
 * Mount once near the app root; call `announce()` from client handlers.
 */

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface LiveAnnouncerValue {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void
}

const LiveAnnouncerContext = createContext<LiveAnnouncerValue | null>(null)

export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState('')
  const [assertive, setAssertive] = useState('')

  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    // Clear then re-set so repeated identical messages still fire.
    if (politeness === 'assertive') {
      setAssertive('')
      window.setTimeout(() => setAssertive(message), 30)
    } else {
      setPolite('')
      window.setTimeout(() => setPolite(message), 30)
    }
  }, [])

  return (
    <LiveAnnouncerContext.Provider value={{ announce }}>
      {children}
      <div className="ep-sr-only" aria-live="polite" aria-atomic="true">
        {polite}
      </div>
      <div className="ep-sr-only" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </LiveAnnouncerContext.Provider>
  )
}

export function useLiveAnnouncer(): LiveAnnouncerValue {
  const ctx = useContext(LiveAnnouncerContext)
  if (!ctx) {
    return { announce: () => {} }
  }
  return ctx
}
