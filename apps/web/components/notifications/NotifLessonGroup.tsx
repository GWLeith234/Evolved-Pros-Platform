'use client'

import { useState } from 'react'
import { NotifItem } from './NotifItem'
import type { NotifItemData } from './NotifItem'

interface NotifLessonGroupProps {
  /** Two or more `course_unlock` notifications to collapse into one row. */
  items: NotifItemData[]
  onRead: (id: string) => void
}

/**
 * SPRINT F — collapses repeated "new lesson in [pillar]" notifications into a
 * single "N new lessons" row so real signal (replies, events) isn't buried.
 * Defaults collapsed; expands in place to the individual lesson items.
 */
export function NotifLessonGroup({ items, onRead }: NotifLessonGroupProps) {
  const [expanded, setExpanded] = useState(false)
  const unreadCount = items.filter(n => !n.isRead).length
  const allRead = unreadCount === 0

  if (expanded) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1.5 font-condensed font-bold uppercase tracking-[0.14em] text-[11px] px-1 py-1 transition-colors"
          style={{ color: 'var(--notif-academy)', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: 'rotate(180deg)' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
          Collapse {items.length} lessons
        </button>
        {items.map(n => (
          <NotifItem key={n.id} notification={n} onRead={() => onRead(n.id)} />
        ))}
      </div>
    )
  }

  return (
    <div
      onClick={() => setExpanded(true)}
      role="button"
      tabIndex={0}
      aria-label={`${items.length} new lessons${allRead ? '' : `, ${unreadCount} unread`}. Expand to view.`}
      aria-expanded={false}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(true) } }}
      className="flex items-center gap-4 px-5 py-4 cursor-pointer rounded-lg transition-all"
      style={{
        backgroundColor: allRead ? 'transparent' : 'var(--notif-unread-wash)',
        border: '1px solid var(--notif-card-border)',
        borderLeft: `3px solid ${allRead ? 'var(--notif-card-border)' : 'var(--notif-academy)'}`,
        opacity: allRead ? 0.75 : 1,
      }}
    >
      {/* Stacked-cards icon */}
      <div
        className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: 'var(--btn-ghost-bg)' }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--notif-academy)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {!allRead && (
            <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--notif-academy)' }} />
          )}
          <span
            className="font-condensed font-bold uppercase tracking-[0.18em] text-[12px]"
            style={{ color: 'var(--notif-academy)' }}
          >
            Academy
          </span>
        </div>
        <p className="font-body font-semibold text-[13px]" style={{ color: 'var(--text-primary)' }}>
          {items.length} new lessons
        </p>
        <p className="font-body text-[13px]" style={{ color: 'var(--text-secondary)' }}>
          {unreadCount > 0 ? `${unreadCount} unread · ` : ''}Tap to view all
        </p>
      </div>

      {/* Chevron */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 self-center" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  )
}
