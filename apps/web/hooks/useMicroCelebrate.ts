'use client'

/**
 * One-shot celebration trigger for streaks / 100% completion.
 * Fires only on the transition into "complete", never on mount or re-render.
 */

import { useEffect, useRef, useState } from 'react'

export function useMicroCelebrate(isComplete: boolean): {
  celebrate: boolean
  clear: () => void
} {
  const [celebrate, setCelebrate] = useState(false)
  const wasComplete = useRef(isComplete)

  useEffect(() => {
    if (isComplete && !wasComplete.current) {
      setCelebrate(true)
    }
    wasComplete.current = isComplete
  }, [isComplete])

  return {
    celebrate,
    clear: () => setCelebrate(false),
  }
}
