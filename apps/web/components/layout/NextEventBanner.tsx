'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LAUNCH_EVENT_TITLE, pickNextBannerEvent } from '@/lib/events/nextEvent'

type NextEvent = { id: string; title: string; starts_at: string } | null

function formatDate(iso: string): string {
  // timeZone: 'UTC' so the rendered string is deterministic regardless of the
  // viewer's locale. starts_at is stored as ISO UTC; matches the EpisodeBanner
  // formatter pattern. Keeps SSR/CSR text identical and avoids React #425.
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'UTC',
  })
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 767px)').matches
}

export function NextEventBanner() {
  const [event, setEvent] = useState<NextEvent>(null)
  const router = useRouter()
  const pathname = usePathname()
  // SPRINT A — Home renders its own combined context strip (event + episode),
  // so this layout-level bar is suppressed there to avoid a double promo bar.
  const suppressed = pathname === '/home'

  useEffect(() => {
    if (suppressed) return
    // Banner is md:hidden — skip the network round-trip on desktop.
    if (!isMobileViewport()) return

    let cancelled = false
    void (async () => {
      // Defer supabase client so this module can SSR without realtime-js eval.
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const nowIso = new Date().toISOString()
      const select = 'id, title, starts_at'
      // Include the April 28 launch lock even if the date has passed so
      // NEXT EVENT stays on the CoS line (EP-EVENTS-APR28-BOOK-OCT15).
      const [launchRes, upcomingRes] = await Promise.all([
        supabase
          .from('events')
          .select(select)
          .eq('is_published', true)
          .eq('title', LAUNCH_EVENT_TITLE)
          .limit(1),
        supabase
          .from('events')
          .select(select)
          .eq('is_published', true)
          .gt('starts_at', nowIso)
          .order('starts_at', { ascending: true })
          .limit(20),
      ])
      if (!cancelled) {
        setEvent(pickNextBannerEvent([...(launchRes.data ?? []), ...(upcomingRes.data ?? [])]))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [suppressed])

  if (suppressed || !event) return null

  const label = `NEXT EVENT · ${event.title} · ${formatDate(event.starts_at)}`

  return (
    <div className="md:hidden flex-shrink-0 flex justify-center w-full" style={{ backgroundColor: 'var(--bg-page)' }}>
      <button
        type="button"
        onClick={() => router.push(`/events/${event.id}`)}
        className="flex items-center justify-between gap-3 w-full max-w-[320px] px-4"
        style={{
          height: '50px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-color)',
        }}
        aria-label={label}
      >
        <span
          className="font-condensed font-semibold truncate"
          style={{ fontSize: '12px', letterSpacing: '0.06em', color: 'var(--text-primary)' }}
        >
          <span style={{ color: 'var(--brand-red-hot)', fontWeight: 700 }}>NEXT EVENT</span>
          {' · '}
          <span style={{ opacity: 0.85 }}>{event.title}</span>
          {' · '}
          <span style={{ opacity: 0.55 }}>{formatDate(event.starts_at)}</span>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0"
          style={{ color: 'var(--brand-red-hot)' }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
