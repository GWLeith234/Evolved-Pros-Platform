'use client'

import { useRouter } from 'next/navigation'
import type { Database } from '@evolved-pros/db'

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
  variant: 'dark' | 'light'
  onRead?: () => void
}

// Type metadata
const TYPE_META: Record<NotifType, { label: string; color: string; bg: string; border: string }> = {
  community_reply:   { label: 'Community',  color: '#68a2b9', bg: 'rgba(104,162,185,0.1)', border: '#68a2b9' },
  community_mention: { label: 'Community',  color: '#68a2b9', bg: 'rgba(104,162,185,0.1)', border: '#68a2b9' },
  event_reminder:    { label: 'Event',       color: '#ef0e30', bg: 'rgba(239,14,48,0.1)',   border: '#ef0e30' },
  course_unlock:     { label: 'Academy',     color: '#c9a84c', bg: 'rgba(201,168,76,0.1)',  border: '#c9a84c' },
  system_billing:    { label: 'System',      color: '#7a8a96', bg: 'rgba(122,138,150,0.08)', border: '#7a8a96' },
  system_general:    { label: 'System',      color: '#7a8a96', bg: 'rgba(122,138,150,0.08)', border: '#7a8a96' },
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
function RichBody({ text, dark }: { text: string; dark: boolean }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  const baseColor = dark ? 'rgba(250,249,247,0.72)' : '#1b3c5a'
  return (
    <span style={{ color: baseColor, fontSize: '13px', lineHeight: 1.5 }}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} style={{ fontWeight: 600, color: dark ? '#faf9f7' : '#112535' }}>
              {part.slice(2, -2)}
            </strong>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

export function NotifItem({ notification, variant, onRead }: NotifItemProps) {
  const router = useRouter()
  const meta = TYPE_META[notification.type]
  const isDark = variant === 'dark'

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

  if (isDark) {
    return (
      <div
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') void handleClick() }}
        className="px-5 py-4 cursor-pointer transition-colors"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: !notification.isRead ? 'rgba(104,162,185,0.06)' : 'transparent',
          opacity: notification.isRead ? 0.72 : 1,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.03)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = !notification.isRead ? 'rgba(104,162,185,0.06)' : 'transparent' }}
      >
        <div className="flex items-center gap-2 mb-1">
          {!notification.isRead && (
            <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
          )}
          <span
            className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px]"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          <span className="font-condensed text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        <RichBody text={notification.body} dark={true} />
      </div>
    )
  }

  // Light variant (notification center page)
  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') void handleClick() }}
      className="flex items-start gap-4 px-5 py-4 cursor-pointer rounded-lg transition-all"
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(27,60,90,0.08)',
        borderLeft: `3px solid ${notification.isRead ? 'rgba(27,60,90,0.08)' : meta.border}`,
        opacity: notification.isRead ? 0.75 : 1,
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: meta.bg }}
      >
        <TypeIcon type={notification.type} color={meta.color} />
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px]"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          <span className="font-condensed text-[10px] ml-auto flex-shrink-0" style={{ color: '#7a8a96' }}>
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
        <p className="font-body font-semibold text-[13px] text-[#112535] mb-0.5">{notification.title}</p>
        <div className="font-body text-[13px]">
          <RichBody text={notification.body} dark={false} />
        </div>
      </div>

      {/* Action */}
      {notification.actionUrl && (
        <span
          className="flex-shrink-0 font-condensed font-semibold uppercase tracking-wide text-[10px] rounded px-3 py-1.5 self-center"
          style={{ color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'transparent' }}
        >
          View →
        </span>
      )}
    </div>
  )
}

function TypeIcon({ type, color }: { type: NotifType; color: string }) {
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
