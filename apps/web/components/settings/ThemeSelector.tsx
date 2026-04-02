'use client'

import { useState } from 'react'

interface Props {
  initialTheme: string
}

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark',  label: 'Dark' },
  { value: 'system', label: 'System' },
]

function applyTheme(t: string) {
  try {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const useDark = t === 'dark' || (t === 'system' && prefersDark)
    if (!useDark) {
      document.documentElement.classList.add('light-mode')
    } else {
      document.documentElement.classList.remove('light-mode')
    }
    localStorage.setItem('ep_theme', t)
  } catch {
    // SSR / no window
  }
}

export function ThemeSelector({ initialTheme }: Props) {
  const [theme, setTheme] = useState(initialTheme || 'dark')
  const [saving, setSaving] = useState(false)

  async function handleSelect(newTheme: string) {
    setTheme(newTheme)
    applyTheme(newTheme)
    setSaving(true)
    try {
      await fetch('/api/settings/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {OPTIONS.map(opt => {
        const active = theme === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            disabled={saving}
            style={{
              padding: '7px 18px',
              borderRadius: '6px',
              border: active ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.12)',
              backgroundColor: active ? 'rgba(201,168,76,0.1)' : 'transparent',
              color: active ? '#C9A84C' : 'rgba(255,255,255,0.45)',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: '12px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
