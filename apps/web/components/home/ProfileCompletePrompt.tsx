'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'profile_prompt_dismissed'

interface ProfileCompletePromptProps {
  hasAvatar: boolean
  hasBio: boolean
  hasTitle: boolean
  hasName: boolean
}

export function ProfileCompletePrompt({ hasAvatar, hasBio, hasTitle, hasName }: ProfileCompletePromptProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = typeof window !== 'undefined'
      ? localStorage.getItem(STORAGE_KEY) === 'true'
      : true
    if (!dismissed) setVisible(true)
  }, [])

  // Only show if the user is missing all three key identity signals:
  // no avatar, no bio, AND no name+title. Having a name and title means
  // the profile is recognizable enough — don't nag them.
  const shouldShow = !hasAvatar && !hasBio && !(hasName && hasTitle)
  if (!shouldShow || !visible) return null

  const missing: string[] = []
  if (!hasAvatar) missing.push('a profile photo')
  if (!hasBio) missing.push('a bio')
  if (!hasTitle) missing.push('a title')

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  return (
    <div
      className="relative flex items-start gap-4 rounded-lg p-4"
      style={{
        backgroundColor: 'rgba(104,162,185,0.08)',
        border: '1px solid rgba(104,162,185,0.2)',
      }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center"
        style={{ backgroundColor: 'rgba(104,162,185,0.15)' }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#68a2b9"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="font-body font-semibold text-sm mb-1"
          style={{ color: 'rgba(255,255,255,0.85)' }}
        >
          Complete your profile
        </p>
        <p
          className="font-body text-xs leading-relaxed mb-3"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          Add {missing.join(', ')} so members know who you are.
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center font-condensed font-semibold uppercase tracking-wide text-xs transition-colors"
          style={{ color: '#68a2b9' }}
        >
          Complete Profile →
        </Link>
      </div>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 transition-colors"
        style={{ color: 'rgba(255,255,255,0.3)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
