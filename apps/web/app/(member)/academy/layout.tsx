'use client'

import { useEffect } from 'react'

// Academy content uses hardcoded dark styles.
// When the user has light-mode active, remove it while on academy pages
// and restore it when they navigate away.
export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement
    const wasLight = html.classList.contains('light-mode')
    if (wasLight) html.classList.remove('light-mode')

    // Override the shared <main> bg-[#faf9f7] directly — inline style wins over Tailwind
    const main = document.querySelector('main') as HTMLElement | null
    const prevMainBg = main?.style.backgroundColor ?? ''
    if (main) main.style.backgroundColor = '#0A0F18'

    return () => {
      if (wasLight) html.classList.add('light-mode')
      if (main) main.style.backgroundColor = prevMainBg
    }
  }, [])

  return (
    <div data-theme="dark" style={{ backgroundColor: '#0A0F18', minHeight: '100%', color: '#ffffff' }}>
      {children}
    </div>
  )
}
