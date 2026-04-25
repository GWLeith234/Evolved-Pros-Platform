'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NotifDrawer } from './NotifDrawer'

interface NotifBellProps {
  initialUnreadCount: number
  userId: string
}

async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await fetch('/api/notifications?limit=1')
    if (!res.ok) return 0
    const data = await res.json() as { unreadCount: number }
    return data.unreadCount ?? 0
  } catch {
    return 0
  }
}

export function NotifBell({ initialUnreadCount, userId }: NotifBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const refreshCount = useCallback(async () => {
    const count = await fetchUnreadCount()
    setUnreadCount(count)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notif-bell-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => setUnreadCount(c => c + 1),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => { void refreshCount() },
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [userId, refreshCount])

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(v => !v)}
        aria-label="Notifications"
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--topnav-bell-icon)',
          transition: 'color 120ms ease',
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
              background: 'var(--brand-red-hot)',
              color: '#fff',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: 9,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-topnav)',
              borderRadius: 999,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <NotifDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userId={userId}
        onRead={() => setUnreadCount(c => Math.max(0, c - 1))}
      />
    </>
  )
}
