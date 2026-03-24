import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const revalidate = 60

type ActivityItem = {
  type: 'community_post' | 'community_reply' | 'event_reminder' | 'lesson_completed' | 'lesson_unlocked'
  text: string
  richParts: { label: string; bold: boolean }[]
  dotColor: 'teal' | 'gold' | 'red'
  createdAt: string
  actionUrl: string
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items: ActivityItem[] = []

  // Fetch recent notifications for this user
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, body, action_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  for (const n of notifications ?? []) {
    let type: ActivityItem['type'] = 'community_post'
    let dotColor: ActivityItem['dotColor'] = 'teal'
    let actionUrl = n.action_url ?? '/home'

    if (n.type === 'community_reply' || n.type === 'community_mention') {
      type = 'community_reply'
      dotColor = 'teal'
      actionUrl = n.action_url ?? '/community'
    } else if (n.type === 'event_reminder') {
      type = 'event_reminder'
      dotColor = 'red'
      actionUrl = n.action_url ?? '/events'
    } else if (n.type === 'course_unlock') {
      type = 'lesson_unlocked'
      dotColor = 'gold'
      actionUrl = n.action_url ?? '/academy'
    } else if (n.type === 'system_billing' || n.type === 'system_general') {
      type = 'community_post'
      dotColor = 'teal'
    }

    items.push({
      type,
      text: n.body,
      richParts: buildRichParts(n.body),
      dotColor,
      createdAt: n.created_at,
      actionUrl,
    })
  }

  // Fetch recent lesson completions for this user
  const { data: completions } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed_at, lessons(id, title, sort_order, course_id, courses(title, slug))')
    .eq('user_id', user.id)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(5)

  for (const c of completions ?? []) {
    if (!c.completed_at) continue
    const lesson = c.lessons as { id: string; title: string; sort_order: number; course_id: string; courses: { title: string; slug: string } | null } | null
    if (!lesson) continue
    const courseName = lesson.courses?.title ?? 'a course'
    const courseSlug = lesson.courses?.slug ?? 'academy'
    const lessonNum = lesson.sort_order + 1
    const text = `You completed Lesson ${lessonNum} in ${courseName}.`

    items.push({
      type: 'lesson_completed',
      text,
      richParts: [
        { label: 'You completed Lesson ', bold: false },
        { label: `${lessonNum}`, bold: true },
        { label: ' in ', bold: false },
        { label: courseName, bold: true },
        { label: '.', bold: false },
      ],
      dotColor: 'gold',
      createdAt: c.completed_at,
      actionUrl: `/academy/${courseSlug}`,
    })
  }

  // Sort all items by date desc and return top 10
  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ items: items.slice(0, 10) })
}

function buildRichParts(text: string): { label: string; bold: boolean }[] {
  // Simple parser: wrap anything in quotes or after "in #" as bold
  return [{ label: text, bold: false }]
}
