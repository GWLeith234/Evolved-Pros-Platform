'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

export function NextEventBanner() {
  const [event, setEvent] = useState<NextEvent>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('events')
      .select('id, title, starts_at')
      .eq('is_published', true)
      .gt('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setEvent(data)
      })
  }, [])

  if (!event) return null

  const label = `NEXT EVENT · ${event.title} · ${formatDate(event.starts_at)}`

  return (
    <div className="md:hidden flex-shrink-0 flex justify-center w-full" style={{ backgroundColor: 'var(--bg-page)' }}>
      <button
        type="button"
        onClick={() => router.push('/events')}
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
          <span style={{ color: '#ef0e30', fontWeight: 700 }}>NEXT EVENT</span>
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
          stroke="#ef0e30"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
