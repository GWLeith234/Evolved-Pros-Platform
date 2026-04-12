export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

// GET /api/media/comments?story_id=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const storyId = searchParams.get('story_id')
  if (!storyId) return NextResponse.json({ error: 'story_id is required' }, { status: 422 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('story_comments')
    .select('id, story_id, user_id, body, created_at')
    .eq('story_id', storyId)
    .order('created_at', { ascending: true })

  if (error) {
    // Graceful fallback if story_comments table doesn't exist yet (migration not run)
    console.warn('[GET /api/media/comments]', error.message)
    return NextResponse.json({ comments: [] })
  }

  const comments = (data ?? []) as {
    id: string; story_id: string; user_id: string; body: string; created_at: string
  }[]

  if (!comments.length) return NextResponse.json({ comments: [] })

  // Fetch author info for all unique user_ids
  const userIds = [...new Set(comments.map(c => c.user_id))]
  const { data: authors } = await adminClient
    .from('users')
    .select('id, display_name, full_name, avatar_url')
    .in('id', userIds)

  const authorMap = new Map(
    (authors ?? []).map(a => [a.id, {
      display_name: a.full_name ?? a.display_name ?? 'Member',
      avatar_url: a.avatar_url,
    }])
  )

  const enriched = comments.map(c => ({
    id: c.id,
    storyId: c.story_id,
    body: c.body,
    createdAt: c.created_at,
    author: authorMap.get(c.user_id) ?? { display_name: 'Member', avatar_url: null },
  }))

  return NextResponse.json({ comments: enriched })
}

// POST /api/media/comments
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let payload: Record<string, unknown>
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const storyId = typeof payload.story_id === 'string' ? payload.story_id.trim() : ''
  const body = typeof payload.body === 'string' ? payload.body.trim() : ''

  if (!storyId) return NextResponse.json({ error: 'story_id is required' }, { status: 422 })
  if (body.length < 1) return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 422 })
  if (body.length > 1000) return NextResponse.json({ error: 'Comment exceeds 1000 characters' }, { status: 422 })

  // Resolve public users.id from auth email (two-UUID pattern)
  const { data: profile } = await adminClient
    .from('users')
    .select('id, display_name, full_name, avatar_url')
    .eq('email', user.email!)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: comment, error } = await (adminClient as any)
    .from('story_comments')
    .insert({ story_id: storyId, user_id: profile.id, body })
    .select('id, story_id, body, created_at')
    .single()

  if (error || !comment) {
    console.error('[POST /api/media/comments]', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to post comment' }, { status: 500 })
  }

  return NextResponse.json({
    comment: {
      id: comment.id,
      storyId: comment.story_id,
      body: comment.body,
      createdAt: comment.created_at,
      author: {
        display_name: profile.full_name ?? profile.display_name ?? 'Member',
        avatar_url: profile.avatar_url,
      },
    },
  }, { status: 201 })
}
