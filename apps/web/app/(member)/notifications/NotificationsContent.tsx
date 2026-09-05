'use client'

import { useState, useCallback } from 'react'
import { NotifFilter } from '@/components/notifications/NotifFilter'
import type { FilterValue } from '@/components/notifications/NotifFilter'
import { NotifItem } from '@/components/notifications/NotifItem'
import { NotifLessonGroup } from '@/components/notifications/NotifLessonGroup'
import type { NotifItemData } from '@/components/notifications/NotifItem'
import { notificationIntent } from '@/lib/notifications/intents'

const MOBILE_FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'all',             label: 'All' },
  { value: 'wig',             label: 'WIG' },
  { value: 'progress',        label: 'Progress' },
  { value: 'content',         label: 'Content' },
  { value: 'community_reply', label: 'Community' },
  { value: 'course_unlock',   label: 'Academy' },
  { value: 'event_reminder',  label: 'Events' },
  { value: 'system_billing',  label: 'System' },
]

function matchesFilter(n: NotifItemData, filter: FilterValue): boolean {
  if (filter === 'all') return true
  const intent = notificationIntent({ type: n.type, title: n.title, actionUrl: n.actionUrl })
  if (filter === 'wig' || filter === 'progress' || filter === 'content') return intent === filter
  if (filter === 'community_reply') return n.type === 'community_reply' || n.type === 'community_mention'
  return n.type === filter
}

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

  const filtered = notifications.filter(n => matchesFilter(n, filter))

  const filterCounts = notifications.reduce<Partial<Record<FilterValue, number>>>((acc, n) => {
    if (n.isRead) return acc
    acc.all = (acc.all ?? 0) + 1
    const intent = notificationIntent({ type: n.type, title: n.title, actionUrl: n.actionUrl })
    if (intent !== 'other') acc[intent] = (acc[intent] ?? 0) + 1
    const key = n.type === 'community_mention' ? 'community_reply' : n.type
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

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

  /**
   * Render a section's items, collapsing a burst of Academy lesson unlocks
   * (`course_unlock`) into one "N new lessons" row so replies/events aren't
   * buried. The collapsed group takes the position of the first lesson;
   * everything else keeps chronological order. A lone lesson renders inline.
   */
  function renderList(list: NotifItemData[], keyPrefix: string) {
    const lessons = list.filter(n => n.type === 'course_unlock')
    const collapse = lessons.length >= 2
    let groupRendered = false
    return list.map(n => {
      if (n.type === 'course_unlock' && collapse) {
        if (groupRendered) return null
        groupRendered = true
        return (
          <NotifLessonGroup
            key={`${keyPrefix}-lesson-group`}
            items={lessons}
            onRead={handleItemRead}
          />
        )
      }
      return (
        <NotifItem
          key={n.id}
          notification={n}
          onRead={() => handleItemRead(n.id)}
        />
      )
    })
  }

  return (
    <div className="flex flex-col md:flex-row" style={{ minHeight: '100%' }}>
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <NotifFilter
          active={filter}
          counts={{ ...typeCounts, ...filterCounts } as Partial<Record<FilterValue, number>>}
          onChange={setFilter}
        />
      </div>

      {/* Mobile horizontal filter pills — snap-x scroll with a right-edge
          fade so it's visually obvious there's more to swipe to at 375px. */}
      <div
        className="flex md:hidden gap-2 overflow-x-auto pb-2 px-4 pt-4 flex-shrink-0 max-w-full"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
          maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
        }}
      >
        {MOBILE_FILTERS.map(f => {
          const isActive = filter === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className="px-3 py-1.5 rounded-full text-xs font-condensed font-semibold uppercase tracking-wider whitespace-nowrap border transition-colors flex-shrink-0"
              style={{
                scrollSnapAlign: 'start',
                backgroundColor: isActive ? 'var(--btn-ghost-bg)' : 'transparent',
                borderColor: 'var(--notif-card-border)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
              }}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      <main className="flex-1 overflow-y-auto min-w-0 max-w-full">
        {/* Header — flex-wrap so the Mark All Read button drops below the
            title at 375px instead of clipping the H1 / subtitle. */}
        <div
          className="px-4 md:px-8 py-5 flex items-start justify-between gap-3 flex-wrap"
          style={{ borderBottom: '1px solid var(--notif-card-border)' }}
        >
          <div className="min-w-0 max-w-full">
            <h1
              className="font-display font-black"
              style={{
                color: 'var(--text-primary)',
                fontSize: 'clamp(1.5rem, 6vw, 1.75rem)',
                lineHeight: 1.1,
                overflowWrap: 'break-word',
                maxWidth: '100%',
              }}
            >
              Notifications
            </h1>
            <p
              className="font-condensed text-[12px] mt-0.5"
              style={{
                color: 'var(--text-tertiary)',
                whiteSpace: 'normal',
                maxWidth: '100%',
                overflow: 'visible',
              }}
            >
              {unreadCount} unread · Last 7 days
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="font-condensed font-semibold uppercase tracking-wide text-[11px] rounded px-4 py-2 transition-all flex-shrink-0"
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--notif-card-border)', backgroundColor: 'transparent', opacity: markingAll ? 0.6 : 1 }}
            >
              {markingAll ? 'Marking...' : 'Mark All Read'}
            </button>
          )}
        </div>

        <div className="px-4 md:px-8 py-6 space-y-2">
          {filtered.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--btn-ghost-bg)', border: '1px solid var(--notif-card-border)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <p className="font-condensed text-sm uppercase tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
                You&apos;re all caught up
              </p>
              <p className="text-xs leading-relaxed max-w-xs" style={{ color: 'var(--text-tertiary)' }}>
                Activity from the community, academy progress, and events will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Unread section */}
              {unread.length > 0 && (
                <>
                  <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[9px] pb-1" style={{ color: 'var(--text-tertiary)' }}>
                    Unread
                  </p>
                  <div className="space-y-1">
                    {renderList(unread, 'unread')}
                  </div>
                </>
              )}

              {/* Divider */}
              {unread.length > 0 && read.length > 0 && (
                <div className="py-2" style={{ borderBottom: '1px solid var(--notif-card-border)' }} />
              )}

              {/* Earlier section */}
              {read.length > 0 && (
                <>
                  <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[9px] pb-1 pt-2" style={{ color: 'var(--text-tertiary)' }}>
                    Earlier
                  </p>
                  <div className="space-y-1">
                    {renderList(read, 'read')}
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
