'use client'

import { useEffect } from 'react'

export function ThemeInit({ defaultTheme }: { defaultTheme: string }) {
  useEffect(() => {
    const stored = localStorage.getItem('ep_theme')
    const theme = stored ?? defaultTheme
    document.documentElement.setAttribute('data-theme', theme)
  }, [defaultTheme])

  return null
}
