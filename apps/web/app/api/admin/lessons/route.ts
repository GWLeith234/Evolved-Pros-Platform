import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { asTranscriptSegments } from '@/lib/academy/transcript'
import { asKeyTakeaways } from '@/lib/academy/takeaways'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const body = await req.json() as {
    course_id: string
    title: string
    slug: string
    description?: string | null
    sort_order?: number
    duration_seconds?: number | null
    is_published?: boolean
    transcript?: unknown
    key_takeaways?: unknown
    discussion_prompt?: unknown
  }

  if (!body.course_id || !body.title?.trim() || !body.slug?.trim()) {
    return NextResponse.json({ error: 'course_id, title, and slug are required' }, { status: 400 })
  }

  const transcript = body.transcript != null ? asTranscriptSegments(body.transcript) : null
  if (body.transcript != null && !transcript) {
    return NextResponse.json(
      { error: 'transcript must be null or an array of { timestamp, seconds, text } segments' },
      { status: 422 },
    )
  }

  const keyTakeaways = body.key_takeaways != null ? asKeyTakeaways(body.key_takeaways) : null
  if (body.key_takeaways != null && !keyTakeaways) {
    return NextResponse.json(
      { error: 'key_takeaways must be null or an array of 1-8 non-empty strings (≤300 chars each)' },
      { status: 422 },
    )
  }

  if (body.discussion_prompt != null && (typeof body.discussion_prompt !== 'string' || body.discussion_prompt.length > 500)) {
    return NextResponse.json(
      { error: 'discussion_prompt must be null or a string of ≤500 chars' },
      { status: 422 },
    )
  }
  const discussionPrompt = typeof body.discussion_prompt === 'string'
    ? body.discussion_prompt.trim() || null
    : null

  // RLS-FIX: adminClient bypasses the lessons RLS admin-role check that
  // breaks for users where auth.uid() ≠ public.users.id.
  const { data, error } = await adminClient
    .from('lessons')
    .insert({
      course_id: body.course_id,
      title: body.title.trim(),
      slug: body.slug.trim(),
      description: body.description ?? null,
      sort_order: body.sort_order ?? 1,
      duration_seconds: body.duration_seconds ?? null,
      is_published: body.is_published ?? false,
      transcript,
      key_takeaways: keyTakeaways,
      discussion_prompt: discussionPrompt,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lesson: data }, { status: 201 })
}
