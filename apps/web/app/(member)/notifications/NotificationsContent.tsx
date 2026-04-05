'use client'

import { useState, useCallback } from 'react'
import { NotifFilter } from '@/components/notifications/NotifFilter'
import { NotifItem } from '@/components/notifications/NotifItem'
import type { NotifItemData } from '@/components/notifications/NotifItem'
import type { Database } from '@evolved-pros/db'

type NotifType = Database['public']['Tables']['notifications']['Row']['type']
type FilterValue = NotifType | 'all'

const MOBILE_FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all',             label: 'All' },
  { value: 'community_reply', label: 'Community' },
  { value: 'course_unlock',   label: 'Academy' },
  { value: 'event_reminder',  label: 'Events' },
  { value: 'system_billing',  label: 'System' },
]

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
    <div className="flex flex-col md:flex-row" style={{ minHeight: '100%' }}>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <NotifFilter
          active={filter}
          counts={typeCounts as Partial<Record<FilterValue, number>>}
          onChange={setFilter}
        />
      </div>

      {/* Mobile horizontal filter pills */}
      <div className="flex md:hidden gap-2 overflow-x-auto pb-2 px-4 pt-4 flex-shrink-0">
        {MOBILE_FILTERS.map(f => {
          const isActive = filter === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className="px-3 py-1.5 rounded-full text-xs font-condensed font-semibold uppercase tracking-wider whitespace-nowrap border transition-colors"
              style={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderColor: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div
          className="px-6 md:px-8 py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div>
            <h1 className="font-display font-black text-[28px] text-white">Notifications</h1>
            <p className="font-condensed text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {unreadCount} unread · Last 7 days
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="font-condensed font-semibold uppercase tracking-wide text-[11px] rounded px-4 py-2 transition-all"
              style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'transparent', opacity: markingAll ? 0.6 : 1 }}
            >
              {markingAll ? 'Marking...' : 'Mark All Read'}
            </button>
          )}
        </div>

        <div className="px-6 md:px-8 py-6 space-y-2">
          {filtered.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <p className="font-condensed text-sm uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                You&apos;re all caught up
              </p>
              <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Activity from the community, academy progress, and events will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Unread section */}
              {unread.length > 0 && (
                <>
                  <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[9px] pb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Unread
                  </p>
                  <div className="space-y-1">
                    {unread.map(n => (
                      <NotifItem
                        key={n.id}
                        notification={n}
                        variant="dark"
                        onRead={() => handleItemRead(n.id)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Divider */}
              {unread.length > 0 && read.length > 0 && (
                <div className="py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }} />
              )}

              {/* Earlier section */}
              {read.length > 0 && (
                <>
                  <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[9px] pb-1 pt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Earlier
                  </p>
                  <div className="space-y-1">
                    {read.map(n => (
                      <NotifItem
                        key={n.id}
                        notification={n}
                        variant="dark"
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
