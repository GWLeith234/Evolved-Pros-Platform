'use client'

import { useRouter } from 'next/navigation'
import type { Database } from '@evolved-pros/db'
import { INTENT_META, notificationIntent } from '@/lib/notifications/intents'

type NotifType = Database['public']['Tables']['notifications']['Row']['type']

export interface NotifItemData {
  id: string
  type: NotifType
  title: string
  body: string
  actionUrl: string | null
  isRead: boolean
  createdAt: string
}

interface NotifItemProps {
  notification: NotifItemData
  onRead?: () => void
}

// Type metadata. `accent` is a theme-aware CSS variable so the eyebrow label,
// unread dot, and left border all pass WCAG AA in both light and dark (the raw
// brand hues fail on a white card — see the --notif-* tokens in globals.css).
const TYPE_META: Record<string, { label: string; accent: string }> = {
  community_reply:   { label: 'Community', accent: 'var(--notif-community)' },
  community_mention: { label: 'Community', accent: 'var(--notif-community)' },
  event_reminder:    { label: 'Event',     accent: 'var(--notif-event)' },
  course_unlock:     { label: 'Academy',   accent: 'var(--notif-academy)' },
  system_billing:    { label: 'System',    accent: 'var(--notif-system)' },
  system_general:    { label: 'System',    accent: 'var(--notif-system)' },
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/** Render **bold** markers as <strong> spans */
function RichBody({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <span style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.5 }}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {part.slice(2, -2)}
            </strong>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

export function NotifItem({ notification, onRead }: NotifItemProps) {
  const router = useRouter()
  const intent = notificationIntent({
    type: notification.type,
    title: notification.title,
    actionUrl: notification.actionUrl,
  })
  const meta = (intent !== 'other' ? INTENT_META[intent] : TYPE_META[notification.type])
    ?? TYPE_META.system_general

  async function handleClick() {
    if (!notification.isRead) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, { method: 'PATCH' })
        onRead?.()
      } catch {
        // non-critical
      }
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${meta.label} notification${notification.isRead ? '' : ', unread'}: ${notification.title}`}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') void handleClick() }}
      className="flex items-start gap-4 px-5 py-4 cursor-pointer rounded-lg transition-all"
      style={{
        backgroundColor: notification.isRead ? 'transparent' : 'var(--notif-unread-wash)',
        border: '1px solid var(--notif-card-border)',
        borderLeft: `3px solid ${notification.isRead ? 'var(--notif-card-border)' : meta.accent}`,
        opacity: notification.isRead ? 0.75 : 1,
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: 'var(--btn-ghost-bg)' }}
      >
        <TypeIcon type={notification.type} intent={intent} color={meta.accent} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {!notification.isRead && (
            <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: meta.accent }} />
          )}
          <span
            className="font-condensed font-bold uppercase tracking-[0.18em] text-[12px]"
            style={{ color: meta.accent }}
          >
            {meta.label}
          </span>
          <span
            suppressHydrationWarning
            className="font-condensed text-[12px] ml-auto flex-shrink-0"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        {notification.title && (
          <p className="font-body font-semibold text-[13px] mb-0.5" style={{ color: 'var(--text-primary)' }}>
            {notification.title}
          </p>
        )}
        <div className="font-body text-[13px]">
          <RichBody text={notification.body} />
        </div>
      </div>

      {/* Action */}
      {notification.actionUrl && (
        <span
          className="flex-shrink-0 font-condensed font-semibold uppercase tracking-wide text-[12px] rounded px-3 py-1.5 self-center"
          style={{ color: 'var(--text-primary)', border: '1px solid var(--notif-card-border)', backgroundColor: 'transparent' }}
        >
          View →
        </span>
      )}
    </div>
  )
}

function TypeIcon({ type, intent, color }: { type: NotifType; intent: ReturnType<typeof notificationIntent>; color: string }) {
  if (intent === 'wig') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
      </svg>
    )
  }
  if (intent === 'progress') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    )
  }
  if (intent === 'content') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20v13H6.5A2.5 2.5 0 0 1 4 17.5z" />
      </svg>
    )
  }
  if (type === 'community_reply' || type === 'community_mention') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  }
  if (type === 'event_reminder') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    )
  }
  if (type === 'course_unlock') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
