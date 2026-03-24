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
        onClick={() => setDrawerOpen(v => !v)}
        className="relative w-8 h-8 flex items-center justify-center rounded transition-colors"
        style={{
          backgroundColor: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        aria-label="Notifications"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 w-[7px] h-[7px] rounded-full"
            style={{ backgroundColor: '#ef0e30' }}
          />
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
