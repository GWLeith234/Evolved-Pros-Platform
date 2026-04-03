'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@evolved-pros/ui'
import { Button } from '@/components/ui/Button'

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
  channel_slug?: string | null
}

interface ActivityFeedProps {
  notifications: NotificationRow[]
  completions: CompletionRow[]
  posts?: PostRow[]
}

type PostFeedItem = {
  kind: 'post'
  id: string
  preview: string
  channelSlug: string
  time: string
  actionUrl: string
}

type OtherFeedItem = {
  kind: 'other'
  id: string
  dotColor: string
  richParts: { label: string; bold: boolean }[]
  time: string
  actionUrl: string
}

type FeedItem = PostFeedItem | OtherFeedItem

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
    const preview = p.body.length > 60 ? p.body.slice(0, 60).trimEnd() + '…' : p.body
    items.push({
      kind: 'post',
      id: `post-${p.id}`,
      preview,
      channelSlug: p.channel_slug ?? 'general',
      time: p.created_at,
      actionUrl: '/community',
    })
  }

  for (const n of notifications) {
    items.push({
      kind: 'other',
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
      kind: 'other',
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

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

export function ActivityFeed({ notifications, completions, posts = [] }: ActivityFeedProps) {
  const items = buildItems(notifications, completions, posts)

  return (
    <Card>
      <CardHeader
        title="Recent Activity"
        action={
          <Button variant="tertiary" size="sm" href="/community">
            See All
          </Button>
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
              <li key={item.id}>
                <Link
                  href={item.actionUrl}
                  className="flex items-start gap-3 px-6 py-3.5 hover:bg-[rgba(27,60,90,0.03)] transition-colors"
                  style={{ borderBottom: i < items.length - 1 ? '1px solid rgba(27,60,90,0.08)' : undefined }}
                >
                  {item.kind === 'post' ? (
                    <>
                      {/* Icon tile */}
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(10,191,163,0.12)', color: '#0ABFA3', marginTop: '1px' }}
                      >
                        <PencilIcon />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-body font-semibold text-[13px] leading-[1.4] truncate"
                          style={{ color: '#1b3c5a' }}
                        >
                          &ldquo;{item.preview}&rdquo;
                        </p>
                        <p className="font-condensed text-[10px] mt-0.5" style={{ color: '#7a8a96' }}>
                          Posted in #{item.channelSlug}
                        </p>
                      </div>

                      {/* Time */}
                      <span className="font-condensed text-[10px] text-[#7a8a96] flex-shrink-0 mt-0.5">
                        <ClientTimeAgo dateStr={item.time} />
                      </span>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
