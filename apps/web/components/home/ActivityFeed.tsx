'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@evolved-pros/ui'

type NotificationRow = {
  id: string
  type: string
  title: string
  body: string
  action_url: string | null
  created_at: string
}

type CompletionRow = {
  lesson_id: string
  completed_at: string | null
  lessons: {
    id: string
    title: string
    sort_order: number
    course_id: string
    courses: { title: string; slug: string } | null
  } | null
}

type PostRow = {
  id: string
  body: string
  created_at: string
}

interface ActivityFeedProps {
  notifications: NotificationRow[]
  completions: CompletionRow[]
  posts?: PostRow[]
}

type FeedItem = {
  id: string
  dotColor: string
  richParts: { label: string; bold: boolean }[]
  time: string
  actionUrl: string
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

// Defers Date.now() to client-only — avoids server/client mismatch (hydration error #425)
function ClientTimeAgo({ dateStr }: { dateStr: string }) {
  const [ago, setAgo] = useState('')
  useEffect(() => { setAgo(timeAgo(dateStr)) }, [dateStr])
  return <>{ago}</>
}

const DOT_COLORS: Record<string, string> = {
  community_reply: '#68a2b9',
  community_mention: '#68a2b9',
  event_reminder: '#ef0e30',
  course_unlock: '#c9a84c',
  system_billing: '#68a2b9',
  system_general: '#68a2b9',
}

function buildItems(notifications: NotificationRow[], completions: CompletionRow[], posts: PostRow[]): FeedItem[] {
  const items: FeedItem[] = []

  for (const p of posts) {
    const preview = p.body.length > 65 ? p.body.slice(0, 65).trimEnd() + '…' : p.body
    items.push({
      id: `post-${p.id}`,
      dotColor: '#0ABFA3',
      richParts: [
        { label: 'You posted: ', bold: false },
        { label: `"${preview}"`, bold: true },
      ],
      time: p.created_at,
      actionUrl: '/community',
    })
  }

  for (const n of notifications) {
    items.push({
      id: `notif-${n.id}`,
      dotColor: DOT_COLORS[n.type] ?? '#68a2b9',
      richParts: [{ label: n.body, bold: false }],
      time: n.created_at,
      actionUrl: n.action_url ?? '/home',
    })
  }

  for (const c of completions) {
    if (!c.completed_at || !c.lessons) continue
    const lesson = c.lessons
    const courseName = lesson.courses?.title ?? 'a course'
    const courseSlug = lesson.courses?.slug ?? 'academy'
    const lessonNum = lesson.sort_order + 1

    items.push({
      id: `progress-${c.lesson_id}`,
      dotColor: '#c9a84c',
      richParts: [
        { label: 'You completed Lesson ', bold: false },
        { label: `${lessonNum}`, bold: true },
        { label: ' in ', bold: false },
        { label: courseName, bold: true },
        { label: '.', bold: false },
      ],
      time: c.completed_at,
      actionUrl: `/academy/${courseSlug}`,
    })
  }

  items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
  return items.slice(0, 5)
}

export function ActivityFeed({ notifications, completions, posts = [] }: ActivityFeedProps) {
  const items = buildItems(notifications, completions, posts)

  return (
    <Card>
      <CardHeader
        title="Recent Activity"
        action={
          <Link
            href="/community"
            className="font-condensed font-semibold uppercase tracking-wide text-xs border rounded px-3 py-1.5 transition-colors"
            style={{
              color: '#1b3c5a',
              borderColor: 'rgba(27,60,90,0.2)',
            }}
          >
            See All →
          </Link>
        }
      />
      <CardBody className="!px-0 !py-0">
        {items.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="font-condensed text-xs tracking-widest text-[#7a8a96]">
              No recent activity
            </p>
          </div>
        ) : (
          <ul>
            {items.map((item, i) => (
              <li
                key={item.id}
                className="flex items-start gap-3 px-6 py-4"
                style={{
                  borderBottom: i < items.length - 1 ? '1px solid rgba(27,60,90,0.08)' : undefined,
                }}
              >
                {/* Dot */}
                <span
                  className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.dotColor }}
                />

                {/* Text */}
                <p className="flex-1 text-[13px] text-[#1b3c5a] leading-[1.5]">
                  {item.richParts.map((part, j) =>
                    part.bold ? <strong key={j}>{part.label}</strong> : part.label
                  )}
                </p>

                {/* Time */}
                <span className="font-condensed text-[10px] text-[#7a8a96] flex-shrink-0 mt-0.5">
                  <ClientTimeAgo dateStr={item.time} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
