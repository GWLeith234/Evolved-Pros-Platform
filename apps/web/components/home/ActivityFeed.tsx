'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@evolved-pros/ui'
import { Button } from '@/components/ui/Button'
import { formatRelative } from '@/lib/format'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

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
    courses: { title: string; slug: string; pillar_number?: number | null } | null
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

// ── Activity type → icon/color taxonomy (A6.3) ───────────────────────────────
// One mapping, applied everywhere. A given activity type always renders the
// same glyph and the same color:
//   post   → edit glyph,     teal tile        (someone wrote something)
//   event  → calendar glyph, red              (a dated happening)
//   lesson → filled dot,     pillar color     (from lib/pillar-colors.ts)
//   notice → filled dot,     neutral slate    (generic notifications)
type FeedGlyph = 'edit' | 'calendar' | 'dot'

const EVENT_COLOR = '#ef0e30' // matches the platform red used for event reminders
const NEUTRAL_COLOR = '#68a2b9' // generic notification slate
const POST_TILE_BG = 'rgba(10,191,163,0.12)'
const POST_TILE_FG = '#0ABFA3' // teal edit tile

/** Lesson dot color comes from the pillar palette — never hardcoded. */
function lessonColor(pillarNumber: number | null | undefined): string {
  if (pillarNumber && PILLAR_CONFIG[pillarNumber]) return PILLAR_CONFIG[pillarNumber].color
  return PILLAR_CONFIG[5].color // Accountability — stable fallback when pillar is unknown
}

type PostFeedItem = {
  kind: 'post'
  glyph: 'edit'
  id: string
  preview: string
  channelSlug: string
  time: string
  actionUrl: string
}

type OtherFeedItem = {
  kind: 'other'
  glyph: FeedGlyph
  id: string
  dotColor: string
  richParts: { label: string; bold: boolean }[]
  time: string
  actionUrl: string
}

type FeedItem = PostFeedItem | OtherFeedItem

// Notification types that represent dated happenings get the calendar/red
// treatment; everything else is a neutral dot.
const EVENT_NOTIF_TYPES = new Set(['event_reminder'])

// Wider surface → append " ago". Same unit ladder as the compact tile rows
// (42 days reads `6w ago` here, `6w` in Community Pulse).
// Defers Date.now() to client-only — avoids server/client mismatch (hydration error #425)
function ClientTimeAgo({ dateStr }: { dateStr: string }) {
  const [ago, setAgo] = useState('')
  useEffect(() => { setAgo(formatRelative(dateStr, { withAgo: true })) }, [dateStr])
  return <>{ago}</>
}

// Course-unlock notifications get their own gold treatment; every other
// notification type falls through to NEUTRAL_COLOR (see isCourseUnlock below).
const COURSE_UNLOCK_COLOR = '#C9A84C' // brand gold — matches var(--brand-gold)

function buildItems(notifications: NotificationRow[], completions: CompletionRow[], posts: PostRow[]): FeedItem[] {
  const items: FeedItem[] = []

  // post → edit glyph, teal tile
  for (const p of posts) {
    const preview = p.body.length > 60 ? p.body.slice(0, 60).trimEnd() + '…' : p.body
    items.push({
      kind: 'post',
      glyph: 'edit',
      id: `post-${p.id}`,
      preview,
      channelSlug: p.channel_slug ?? 'general',
      time: p.created_at,
      actionUrl: '/community',
    })
  }

  // event → calendar glyph + red; course unlock → gold; everything else → neutral dot
  for (const n of notifications) {
    const isEvent = EVENT_NOTIF_TYPES.has(n.type)
    const isCourseUnlock = n.type === 'course_unlock'
    items.push({
      kind: 'other',
      glyph: isEvent ? 'calendar' : 'dot',
      id: `notif-${n.id}`,
      dotColor: isEvent ? EVENT_COLOR : isCourseUnlock ? COURSE_UNLOCK_COLOR : NEUTRAL_COLOR,
      richParts: [{ label: n.body, bold: false }],
      time: n.created_at,
      actionUrl: n.action_url ?? '/home',
    })
  }

  // lesson → pillar-colored dot (from lib/pillar-colors.ts)
  for (const c of completions) {
    if (!c.completed_at || !c.lessons) continue
    const lesson = c.lessons
    const courseName = lesson.courses?.title ?? 'a course'
    const courseSlug = lesson.courses?.slug ?? 'academy'
    const lessonNum = lesson.sort_order + 1

    items.push({
      kind: 'other',
      glyph: 'dot',
      id: `progress-${c.lesson_id}`,
      dotColor: lessonColor(lesson.courses?.pillar_number),
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

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
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
                      {/* post → edit glyph in a teal tile */}
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: POST_TILE_BG, color: POST_TILE_FG, marginTop: '1px' }}
                      >
                        <PencilIcon />
                      </div>

                      {/* Content — context line on ALL post rows */}
                      <div className="flex-1 min-w-0">
                        <p
                          className="font-body font-semibold text-[13px] leading-[1.4] truncate"
                          style={{ color: '#1b3c5a' }}
                        >
                          &ldquo;{item.preview}&rdquo;
                        </p>
                        <p className="font-condensed text-[12px] mt-0.5" style={{ color: '#7a8a96' }}>
                          Posted in #{item.channelSlug}
                        </p>
                      </div>

                      {/* Time */}
                      <span className="font-condensed text-[12px] text-[#7a8a96] flex-shrink-0 mt-0.5">
                        <ClientTimeAgo dateStr={item.time} />
                      </span>
                    </>
                  ) : (
                    <>
                      {/* event → calendar glyph + red tile; lesson/notice → filled dot */}
                      {item.glyph === 'calendar' ? (
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${item.dotColor}1f`, color: item.dotColor, marginTop: '1px' }}
                        >
                          <CalendarIcon />
                        </div>
                      ) : (
                        <span
                          className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.dotColor }}
                        />
                      )}

                      {/* Text */}
                      <p className="flex-1 text-[13px] text-[#1b3c5a] leading-[1.5]">
                        {item.richParts.map((part, j) =>
                          part.bold ? <strong key={j}>{part.label}</strong> : part.label
                        )}
                      </p>

                      {/* Time */}
                      <span className="font-condensed text-[12px] text-[#7a8a96] flex-shrink-0 mt-0.5">
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
