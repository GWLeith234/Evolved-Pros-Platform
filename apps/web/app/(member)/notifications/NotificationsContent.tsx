'use client'

import { useState, useCallback } from 'react'
import { NotifFilter } from '@/components/notifications/NotifFilter'
import { NotifItem } from '@/components/notifications/NotifItem'
import type { NotifItemData } from '@/components/notifications/NotifItem'
import type { Database } from '@evolved-pros/db'

type NotifType = Database['public']['Tables']['notifications']['Row']['type']
type FilterValue = NotifType | 'all'

interface NotificationsContentProps {
  initialNotifications: NotifItemData[]
  unreadCount: number
  typeCounts: Partial<Record<string, number>>
}

export function NotificationsContent({
  initialNotifications,
  unreadCount: initialUnread,
  typeCounts,
}: NotificationsContentProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [markingAll, setMarkingAll] = useState(false)
  const [unreadCount, setUnreadCount] = useState(initialUnread)

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'community_reply') return n.type === 'community_reply' || n.type === 'community_mention'
    return n.type === filter
  })

  const unread = filtered.filter(n => !n.isRead)
  const read = filtered.filter(n => n.isRead)

  const handleItemRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
  }, [])

  async function handleMarkAllRead() {
    setMarkingAll(true)
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="flex" style={{ minHeight: '100%' }}>
      <NotifFilter
        active={filter}
        counts={typeCounts as Partial<Record<FilterValue, number>>}
        onChange={setFilter}
      />

      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#faf9f7' }}>
        {/* Header */}
        <div
          className="px-8 py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(27,60,90,0.08)', backgroundColor: 'white' }}
        >
          <div>
            <h1 className="font-display font-black text-[28px] text-[#112535]">Notifications</h1>
            <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
              {unreadCount} unread · Last 7 days
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="font-condensed font-semibold uppercase tracking-wide text-[11px] rounded px-4 py-2 transition-all"
              style={{ color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'transparent', opacity: markingAll ? 0.6 : 1 }}
            >
              {markingAll ? 'Marking...' : 'Mark All Read'}
            </button>
          )}
        </div>

        <div className="px-8 py-6 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-condensed text-[12px] uppercase tracking-widest text-[#7a8a96]">
                No notifications.
              </p>
            </div>
          ) : (
            <>
              {/* Unread section */}
              {unread.length > 0 && (
                <>
                  <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[9px] text-[#7a8a96] pb-1">
                    Unread
                  </p>
                  <div className="space-y-1">
                    {unread.map(n => (
                      <NotifItem
                        key={n.id}
                        notification={n}
                        variant="light"
                        onRead={() => handleItemRead(n.id)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Divider */}
              {unread.length > 0 && read.length > 0 && (
                <div className="py-2" style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }} />
              )}

              {/* Earlier section */}
              {read.length > 0 && (
                <>
                  <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[9px] text-[#7a8a96] pb-1 pt-2">
                    Earlier
                  </p>
                  <div className="space-y-1">
                    {read.map(n => (
                      <NotifItem
                        key={n.id}
                        notification={n}
                        variant="light"
                        onRead={() => handleItemRead(n.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
