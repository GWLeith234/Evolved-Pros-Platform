export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import type { Reply } from '@/lib/community/types'
import { notifyReply } from '@/lib/notifications/create'

function toReply(row: {
  id: string
  post_id: string
  body: string
  created_at: string
  users: { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null } | null
}): Reply {
  return {
    id: row.id,
    postId: row.post_id,
    body: row.body,
    createdAt: row.created_at,
    author: {
      id: row.users?.id ?? '',
      displayName: row.users?.full_name ?? row.users?.display_name ?? 'Member',
      avatarUrl: row.users?.avatar_url ?? null,
    },
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('replies')
    .select('id, post_id, body, created_at, users(id, display_name, full_name, avatar_url)')
    .eq('post_id', params.postId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 })

  const replies = (data ?? []).map(r => toReply(r as Parameters<typeof toReply>[0]))
  return NextResponse.json({ replies })
}

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { body?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const replyBody = typeof body.body === 'string' ? body.body.trim() : ''
  if (replyBody.length < 1) return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 422 })
  if (replyBody.length > 2000) return NextResponse.json({ error: 'Reply exceeds 2000 characters' }, { status: 422 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any).rpc('create_post_reply', {
    p_user_id: profile.id,
    p_post_id: params.postId,
    p_body: replyBody,
  })

  if (error) {
    const msg = error.message ?? ''
    if (msg.includes('empty_body')) return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 422 })
    if (msg.includes('body_too_long')) return NextResponse.json({ error: 'Reply exceeds 2000 characters' }, { status: 422 })
    if (msg.includes('post_not_found')) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })
  }

  const row = (Array.isArray(data) ? data[0] : data) as {
    reply_id: string
    post_id: string
    body: string
    created_at: string
    author_id: string
    author_display_name: string | null
    author_full_name: string | null
    author_avatar_url: string | null
    post_author_id: string
    channel_slug: string
    reply_count: number
  } | null

  if (!row) return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })

  void notifyReply({
    postAuthorId:    row.post_author_id,
    replyAuthorId:   row.author_id,
    replyAuthorName: row.author_display_name ?? row.author_full_name ?? 'Someone',
    channelSlug:     row.channel_slug || 'general',
    postId:          row.post_id,
    replySnippet:    replyBody,
  })

  return NextResponse.json(
    toReply({
      id: row.reply_id,
      post_id: row.post_id,
      body: row.body,
      created_at: row.created_at,
      users: {
        id: row.author_id,
        display_name: row.author_display_name,
        full_name: row.author_full_name,
        avatar_url: row.author_avatar_url,
      },
    }),
    { status: 201 },
  )
}
