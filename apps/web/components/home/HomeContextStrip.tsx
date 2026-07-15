'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// SPRINT A — one compact, dismissible context strip replacing the two stacked
// promo bars (NEXT EVENT + LATEST EPISODE) that used to eat above-the-fold room
// on Home. Next event is primary (time-bound); the latest episode rides along
// as a secondary link on wider screens. Theme-aware via the episode-banner
// tokens. Dismissal is keyed on a content signature so it returns when the
// event/episode changes.

export interface HomeContextEvent {
  title: string
  dateLabel: string
  href: string
}
export interface HomeContextEpisode {
  title: string
  href: string
}

const DISMISS_KEY = 'ep_home_context_dismissed'

export function HomeContextStrip({
  event,
  episode,
  signature,
}: {
  event: HomeContextEvent | null
  episode: HomeContextEpisode | null
  signature: string
}) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === signature) setDismissed(true)
    } catch {
      // localStorage unavailable (private mode / SSR bridge) — just render.
    }
  }, [signature])

  if (dismissed || (!event && !episode)) return null

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, signature)
    } catch {
      /* no-op */
    }
    setDismissed(true)
  }

  return (
    <div
      className="flex items-center gap-3 px-4 sm:px-5 min-h-[36px] py-1.5 w-full max-w-full overflow-hidden box-border"
      style={{
        backgroundColor: 'var(--episode-banner-bg)',
        borderTop: '2px solid var(--brand-gold, #C9A84C)',
        borderBottom: '1px solid var(--episode-banner-border)',
        flexShrink: 0,
      }}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1 text-[12px]">
        {event && (
          <Link
            href={event.href}
            className="flex items-center gap-2 min-w-0"
            style={{ color: 'var(--episode-banner-text)', textDecoration: 'none' }}
          >
            <span
              className="font-bold uppercase tracking-wider rounded-[3px] px-1.5 py-[1px] shrink-0"
              style={{ backgroundColor: 'var(--brand-gold, #C9A84C)', color: '#0A0F18' }}
            >
              Next
            </span>
            <span className="truncate" style={{ fontWeight: 500 }}>{event.title}</span>
            <span className="hidden sm:inline shrink-0" style={{ color: 'var(--episode-banner-text-dim)' }}>
              · {event.dateLabel}
            </span>
          </Link>
        )}

        {event && episode && (
          <span className="shrink-0" style={{ color: 'var(--episode-banner-border)' }}>|</span>
        )}

        {episode && (
          <Link
            href={episode.href}
            className={`items-center gap-1.5 min-w-0 ${event ? 'hidden md:flex' : 'flex'}`}
            style={{ color: 'var(--episode-banner-text-dim)', textDecoration: 'none' }}
          >
            <span className="shrink-0" aria-hidden>▶</span>
            <span className="truncate">{episode.title}</span>
          </Link>
        )}
      </div>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-[13px]"
        style={{ color: 'var(--episode-banner-text-dim)' }}
      >
        ✕
      </button>
    </div>
  )
}
