'use client'

import { useEffect } from 'react'

interface PodcastThemeBridgeProps {
  theme: 'parchment' | 'navy'
}

export function PodcastThemeBridge({ theme }: PodcastThemeBridgeProps) {
  // Owns only body[data-theme], scoped to this podcast page. The global
  // light-mode class on <html> belongs to ThemeProvider — this component
  // must never add/remove it, or navigating away from /podcast would
  // silently flip the user's app-wide theme back to dark.
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    return () => {
      document.body.removeAttribute('data-theme')
    }
  }, [theme])
  return null
}
