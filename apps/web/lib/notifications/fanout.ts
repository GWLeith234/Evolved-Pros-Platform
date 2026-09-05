import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { mediaStoryHref } from '@/lib/media/paths'
import { listActiveMemberIds } from '@/lib/notifications/nudges'
import { CONTENT_DEDUPE_MS, contentCopy, type ContentKind } from '@/lib/notifications/intents'
import { INTENT_TYPE } from '@/lib/notifications/intents'

function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export async function fanoutContentDrop(params: {
  kind: ContentKind
  title: string
  actionUrl: string
  eventType?: string | null
}): Promise<number> {
  const type = INTENT_TYPE[params.kind]
  const copy = contentCopy(params.kind, params.title, params.eventType)
  const since = new Date(Date.now() - CONTENT_DEDUPE_MS).toISOString()

  const [memberIds, existingRes] = await Promise.all([
    listActiveMemberIds(),
    adminClient
      .from('notifications')
      .select('user_id')
      .eq('type', type)
      .eq('action_url', params.actionUrl)
      .gte('created_at', since),
  ])

  const skip = new Set((existingRes.data ?? []).map(r => r.user_id))
  const rows = memberIds
    .filter(id => !skip.has(id))
    .map(userId => ({
      user_id: userId,
      type,
      title: copy.title,
      body: copy.body,
      action_url: params.actionUrl,
      is_read: false,
    }))

  if (rows.length === 0) return 0

  const { error } = await adminClient.from('notifications').insert(rows)
  if (error) {
    console.error('[notifications/fanout]', error)
    return 0
  }
  return rows.length
}

export async function notifyLessonPublished(lessonId: string): Promise<number> {
  const { data, error } = await adminClient
    .from('lessons')
    .select('id, title, slug, course_id, courses(slug, title)')
    .eq('id', lessonId)
    .maybeSingle()

  if (error) {
    console.error('[notifications/fanout] lesson lookup', error)
    return 0
  }
  if (!data) return 0

  const course = firstJoin(data.courses as { slug: string; title: string } | { slug: string; title: string }[] | null)
  const courseSlug = course?.slug ?? 'academy'
  return fanoutContentDrop({
    kind: 'academy',
    title: data.title,
    actionUrl: `/academy/${courseSlug}/${data.slug}`,
  })
}

export async function notifyEventPublished(params: {
  eventId: string
  title: string
  eventType?: string | null
}): Promise<number> {
  return fanoutContentDrop({
    kind: 'live',
    title: params.title,
    actionUrl: `/events/${params.eventId}`,
    eventType: params.eventType,
  })
}

export async function notifyMediaPublished(params: {
  title: string
  slug: string
  pillar?: string | null
}): Promise<number> {
  return fanoutContentDrop({
    kind: 'media',
    title: params.title,
    actionUrl: mediaStoryHref(params.pillar, params.slug),
  })
}
