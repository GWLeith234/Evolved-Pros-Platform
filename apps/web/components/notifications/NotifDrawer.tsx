'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { NotifItem } from './NotifItem'
import type { NotifItemData } from './NotifItem'
import { createClient } from '@/lib/supabase/client'

interface NotifDrawerProps {
  open: boolean
  onClose: () => void
  userId: string
  onRead: () => void
}

function SkeletonRow() {
  return (
    <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="h-2 w-16 rounded mb-2" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
      <div className="h-3 w-full rounded mb-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
      <div className="h-3 w-3/4 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
    </div>
  )
}

export function NotifDrawer({ open, onClose, userId, onRead }: NotifDrawerProps) {
  const [notifications, setNotifications] = useState<NotifItemData[]>([])
  const [loading, setLoading] = useState(false)
  const [fetched, setFetched] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=10')
      if (!res.ok) return
      const data = await res.json() as { notifications: NotifItemData[] }
      setNotifications(data.notifications ?? [])
      setFetched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open && !fetched) {
      void fetchNotifications()
    }
  }, [open, fetched, fetchNotifications])

  function handleItemRead(id: string) {
    onRead()
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
  }

  async function handleMarkAllRead() {
    const unreadCount = notifications.filter(n => !n.isRead).length
    if (unreadCount === 0) return
    setMarkingAll(true)
    try {
      const supabase = createClient()
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      // Notify parent to reset unread count to 0
      for (let i = 0; i < unreadCount; i++) onRead()
    } catch {
      // non-critical
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <>
      {/* Drawer */}
      <div
        className="fixed top-14 right-0 bottom-0 z-[300] flex flex-col"
        style={{
          width: '360px',
          backgroundColor: '#112535',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s ease',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="font-condensed font-bold uppercase tracking-wide text-[14px] text-white">
            Notifications
          </span>
          <div className="flex items-center gap-3">
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={() => { void handleMarkAllRead() }}
                disabled={markingAll}
                className="font-condensed font-semibold uppercase tracking-wide text-[10px] transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)', opacity: markingAll ? 0.5 : 1 }}
                onMouseEnter={e => { if (!markingAll) (e.currentTarget as HTMLElement).style.color = '#68a2b9' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)' }}
                aria-label="Mark all as read"
              >
                {markingAll ? 'Marking...' : 'Mark all read'}
              </button>
            )}
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)' }}
              aria-label="Close notifications"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && !fetched ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
          ) : notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="font-condensed text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
                You're all caught up!
              </p>
            </div>
          ) : (
            notifications.map(n => (
              <NotifItem
                key={n.id}
                notification={n}
                variant="dark"
                onRead={() => handleItemRead(n.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div
            className="px-5 py-3 flex-shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Link
              href="/notifications"
              onClick={onClose}
              className="font-condensed font-semibold uppercase tracking-wide text-[11px] transition-colors"
              style={{ color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' }}
            >
              View All →
            </Link>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[290] top-14"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
          onClick={onClose}
        />
      )}
    </>
  )
}
