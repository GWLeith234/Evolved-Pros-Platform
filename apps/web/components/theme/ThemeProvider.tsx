'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: ResolvedTheme
  resolvedTheme: ResolvedTheme
  setTheme: (next: ResolvedTheme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const THEME_META: Record<ResolvedTheme, string> = {
  dark: '#0A0F18',
  light: '#F5F0E8',
}

function applyThemeToDocument(next: ResolvedTheme) {
  document.documentElement.classList.toggle('light-mode', next === 'light')
  // Keep browser chrome (iOS status bar / Android toolbar) in sync.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_META[next])
  // Also set color-scheme so native form controls match.
  document.documentElement.style.colorScheme = next
}

/**
 * Wraps ThemeInit's inline pre-paint script (which already applied the
 * correct `light-mode` class before hydration) with a React-visible context.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')

  useEffect(() => {
    const initial = document.documentElement.classList.contains('light-mode') ? 'light' : 'dark'
    setResolvedTheme(initial)
    applyThemeToDocument(initial)
  }, [])

  const setTheme = useCallback((next: ResolvedTheme) => {
    localStorage.setItem('ep_theme', next)
    applyThemeToDocument(next)
    setResolvedTheme(next)
    // Best-effort server persistence (settings API may no-op when unauthenticated).
    void fetch('/api/settings/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: next }),
    }).catch(() => {})
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
  }, [resolvedTheme, setTheme])

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
