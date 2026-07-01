'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: ResolvedTheme
  resolvedTheme: ResolvedTheme
  setTheme: (next: ResolvedTheme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * Wraps ThemeInit's inline pre-paint script (which already applied the
 * correct `light-mode` class before hydration) with a React-visible context.
 * Reads DOM state once on mount rather than re-deriving from localStorage /
 * matchMedia independently — ThemeInit already resolved 'system' if that was
 * the stored preference, so by the time this mounts there's nothing left to
 * resolve, only to read.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')

  useEffect(() => {
    setResolvedTheme(document.documentElement.classList.contains('light-mode') ? 'light' : 'dark')
  }, [])

  const setTheme = useCallback((next: ResolvedTheme) => {
    localStorage.setItem('ep_theme', next)
    document.documentElement.classList.toggle('light-mode', next === 'light')
    setResolvedTheme(next)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
