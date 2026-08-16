'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface NotifBellProps {
  initialUnreadCount: number
  userId: string
}

async function fetchUnreadCount(): Promise<number> {
  try {
    // countOnly skips the notification list query on the server.
    const res = await fetch('/api/notifications?countOnly=1')
    if (!res.ok) return 0
    const data = await res.json() as { unreadCount: number }
    return data.unreadCount ?? 0
  } catch {
    return 0
  }
}

export function NotifBell({ initialUnreadCount, userId }: NotifBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)

  // userId is retained in the props contract for callers/back-compat, but the
  // bell no longer opens an in-nav drawer — it links straight to the feed.
  void userId

  const refreshCount = useCallback(async () => {
    const count = await fetchUnreadCount()
    setUnreadCount(count)
  }, [])

  // Poll every 30s instead of holding a Supabase Realtime WebSocket open.
  // The persistent transport prevented the browser from reaching idle, which
  // broke Lighthouse, Puppeteer, and any tool that waits on the `load` event.
  // PERF: skip ticks while the tab is hidden; refresh immediately on focus.
  useEffect(() => {
    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      void refreshCount()
    }
    const interval = setInterval(tick, 30000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refreshCount()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refreshCount])

  return (
    <Link
      href="/notifications"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      style={{
        position: 'relative',
        width: 44,
        height: 44,
        minWidth: 44,
        minHeight: 44,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--topnav-bell-icon)',
        transition: 'color 120ms ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--topnav-link-active)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--topnav-bell-icon)' }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            minWidth: 14,
            height: 14,
            padding: '0 3px',
            background: 'var(--brand-red-hover)',
            color: '#fff',
            fontFamily: 'var(--font-condensed), sans-serif',
            fontWeight: 700,
            fontSize: 9,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--bg-nav)',
            borderRadius: 999,
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
