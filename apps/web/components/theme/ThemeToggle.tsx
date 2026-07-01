'use client'

import { useTheme } from './ThemeProvider'

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isLight = resolvedTheme === 'light'

  return (
    <button
      type="button"
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: '50%',
        padding: 0,
        border: 'none',
        background: 'transparent',
        color: 'var(--topnav-bell-icon)',
        cursor: 'pointer',
        transition: 'color 120ms ease, background 120ms ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--topnav-divider)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {isLight ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}
