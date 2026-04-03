'use client'

import { useEffect } from 'react'

// Academy content uses hardcoded dark styles.
// When the user has light-mode active, remove it while on academy pages
// and restore it when they navigate away.
export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  // Remove light-mode class while on academy pages so text colour overrides in
  // globals.css (html.light-mode main .text-white) don't invert academy text.
  // Background is handled by CSS :has([data-academy-page]) in globals.css.
  useEffect(() => {
    const html = document.documentElement
    const wasLight = html.classList.contains('light-mode')
    if (wasLight) html.classList.remove('light-mode')
    return () => {
      if (wasLight) html.classList.add('light-mode')
    }
  }, [])

  return (
    <div data-academy-page style={{ backgroundColor: '#0A0F18', minHeight: '100%', color: '#ffffff' }}>
      {children}
    </div>
  )
}
