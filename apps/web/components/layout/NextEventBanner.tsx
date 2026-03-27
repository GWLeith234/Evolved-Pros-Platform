'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type NextEvent = { id: string; title: string; starts_at: string } | null

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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
    <div className="md:hidden flex-shrink-0 flex justify-center w-full" style={{ backgroundColor: '#0d1c27' }}>
      <button
        type="button"
        onClick={() => router.push('/events')}
        className="flex items-center justify-between gap-3 w-full max-w-[320px] px-4"
        style={{
          height: '50px',
          backgroundColor: '#112535',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
        aria-label={label}
      >
        <span
          className="font-condensed font-semibold text-white truncate"
          style={{ fontSize: '11px', letterSpacing: '0.06em' }}
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
