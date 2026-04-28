'use client'

import { useEffect } from 'react'

interface PodcastThemeBridgeProps {
  theme: 'parchment' | 'navy'
}

export function PodcastThemeBridge({ theme }: PodcastThemeBridgeProps) {
  useEffect(() => {
    const isLight = theme === 'parchment'
    if (isLight) {
      document.body.setAttribute('data-theme', 'light')
      document.documentElement.classList.add('light-mode')
    } else {
      document.body.removeAttribute('data-theme')
      document.documentElement.classList.remove('light-mode')
    }
    return () => {
      document.body.removeAttribute('data-theme')
      document.documentElement.classList.remove('light-mode')
    }
  }, [theme])
  return null
}
