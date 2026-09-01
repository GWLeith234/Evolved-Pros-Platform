'use client'

import { useTheme } from './ThemeProvider'
import { toggleLabel } from '@/lib/theme'

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

/** 'system' — a display, i.e. "follow whatever this device is set to". */
function SystemIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

/**
 * Cycles the stored preference: system → light → dark → system.
 *
 * The icon shows the *current* preference (a display for 'system'), so all
 * three states are reachable and distinguishable from the nav — this is the
 * only theme control on the platform.
 */
export function ThemeToggle() {
  const { preference, toggleTheme } = useTheme()
  const label = toggleLabel(preference)

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="ep-touch-target"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        minWidth: 40,
        minHeight: 40,
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
      {preference === 'system' ? <SystemIcon /> : preference === 'light' ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
