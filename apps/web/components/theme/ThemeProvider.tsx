'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import {
  THEME_COLOR,
  THEME_PREF_ATTR,
  THEME_STORAGE_KEY,
  isThemePreference,
  nextPreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme'

export type { ResolvedTheme, ThemePreference }

interface ThemeContextValue {
  /** The stored choice: 'light' | 'dark' | 'system'. */
  preference: ThemePreference
  /** @deprecated Use `resolvedTheme` (or `preference`). Kept for call-site back-compat. */
  theme: ResolvedTheme
  /** What is actually rendered right now — 'system' resolved against the OS. */
  resolvedTheme: ResolvedTheme
  setTheme: (next: ThemePreference) => void
  /** Cycles system → light → dark → system. */
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const DARK_QUERY = '(prefers-color-scheme: dark)'

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return window.matchMedia(DARK_QUERY).matches
}

/** Reads the preference the pre-paint script (ThemeInit/ThemeSync) settled on. */
function readPreferenceFromDocument(): ThemePreference {
  const attr = document.documentElement.getAttribute(THEME_PREF_ATTR)
  if (isThemePreference(attr)) return attr
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemePreference(stored)) return stored
  } catch {
    // private-mode / storage disabled
  }
  // Fall back to whatever class is actually on <html> so we never fight the DOM.
  return document.documentElement.classList.contains('light-mode') ? 'light' : 'dark'
}

function applyThemeToDocument(preference: ThemePreference, resolved: ResolvedTheme) {
  const el = document.documentElement
  el.classList.toggle('light-mode', resolved === 'light')
  el.setAttribute(THEME_PREF_ATTR, preference)
  // Keep native form controls in sync.
  el.style.colorScheme = resolved
  // Keep browser chrome (iOS status bar / Android toolbar) in sync.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLOR[resolved])
}

// useLayoutEffect on the client (runs before paint, so consumers that key off
// resolvedTheme in inline styles don't visibly flip), plain effect on the
// server where useLayoutEffect would warn.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Owns the theme preference for the React tree.
 *
 * The pre-paint script in <head> (ThemeInit) has already put the right class on
 * <html>; for a signed-in member ThemeSync has already corrected it to the
 * stored `public.users.theme`. This provider adopts that value, keeps 'system'
 * live against prefers-color-scheme, and persists changes to the server.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // SSR renders with 'dark' (matching previous behaviour, so hydration output
  // is unchanged); the layout effect below adopts the real value before paint.
  const [preference, setPreference] = useState<ThemePreference>('dark')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')

  useIsomorphicLayoutEffect(() => {
    const initial = readPreferenceFromDocument()
    setPreference(initial)
    const resolved = resolveTheme(initial, systemPrefersDark())
    setResolvedTheme(resolved)
    applyThemeToDocument(initial, resolved)
  }, [])

  // 'system' must track the OS at runtime, not resolve once at write time.
  useEffect(() => {
    if (preference !== 'system') return
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mql = window.matchMedia(DARK_QUERY)
    const onChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const resolved: ResolvedTheme = event.matches ? 'dark' : 'light'
      setResolvedTheme(resolved)
      applyThemeToDocument('system', resolved)
    }
    onChange(mql)
    // Safari < 14 only has addListener.
    if (mql.addEventListener) {
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    }
    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [preference])

  // Drop a stale in-flight PATCH if the user toggles again quickly.
  const inFlight = useRef<AbortController | null>(null)
  useEffect(() => () => inFlight.current?.abort(), [])

  const setTheme = useCallback((next: ThemePreference) => {
    if (!isThemePreference(next)) return

    const resolved = resolveTheme(next, systemPrefersDark())
    setPreference(next)
    setResolvedTheme(resolved)
    applyThemeToDocument(next, resolved)

    // Pre-paint hint for the next load in this browser.
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // private-mode / storage disabled — server persistence still applies
    }

    // Persist for the signed-in user. Signed-out visitors get a 401 here and
    // keep working on localStorage / system alone — the toggle never requires auth.
    inFlight.current?.abort()
    const controller = new AbortController()
    inFlight.current = controller
    void fetch('/api/settings/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: next }),
      signal: controller.signal,
    }).catch(() => {})
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(nextPreference(preference))
  }, [preference, setTheme])

  return (
    <ThemeContext.Provider
      value={{ preference, theme: resolvedTheme, resolvedTheme, setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider')
  return ctx
}
