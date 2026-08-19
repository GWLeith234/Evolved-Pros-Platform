export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { toPostMedia } from '@/lib/community/media'
import type { Reply } from '@/lib/community/types'
import { notifyReply } from '@/lib/notifications/create'

function toReply(row: {
  id: string
  post_id: string
  body: string
  created_at: string
  // CM-1 media columns (migration 079) — null on every pre-079 row.
  media_url?: string | null
  media_kind?: string | null
  media_width?: number | null
  media_height?: number | null
  users: { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null } | null
}): Reply {
  return {
    id: row.id,
    postId: row.post_id,
    body: row.body,
    createdAt: row.created_at,
    media: toPostMedia(row),
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('replies')
    .select('id, post_id, body, created_at, media_url, media_kind, media_width, media_height, users(id, display_name, full_name, avatar_url)')
    .eq('post_id', params.postId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Failed to fetch replies' }, { status: 500 })

  const replies = (data ?? []).map(r => toReply(r as Parameters<typeof toReply>[0]))
  return NextResponse.json({ replies })
}

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { body?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const replyBody = typeof body.body === 'string' ? body.body.trim() : ''
  if (replyBody.length < 1) return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 422 })
  if (replyBody.length > 2000) return NextResponse.json({ error: 'Reply exceeds 2000 characters' }, { status: 422 })

  // RLS-FIX: resolve public.users.id by email (auth.uid() ≠ public.users.id
  // for many users) — used for FK columns + self-row updates below.
  const { data: profileRow, error: profileErr } = await adminClient
    .from('users')
    .select('id, display_name, full_name, points')
    .eq('email', user.email)
    .single()
  if (profileErr || !profileRow) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
  }
  const authorId = profileRow.id

  // Verify post exists and get author + channel
  const { data: post } = await adminClient
    .from('posts')
    .select('author_id, reply_count, channels(slug)')
    .eq('id', params.postId)
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const { data: reply, error } = await adminClient
    .from('replies')
    .insert({ post_id: params.postId, author_id: authorId, body: replyBody } as never)
    .select('id, post_id, body, created_at, media_url, media_kind, media_width, media_height, users(id, display_name, full_name, avatar_url)')
    .single()

  if (error || !reply) return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })

  // Increment reply_count on post
  await adminClient
    .from('posts')
    .update({ reply_count: post.reply_count + 1 })
    .eq('id', params.postId)

  // Award 5 points to reply author
  await adminClient
    .from('users')
    .update({ points: (profileRow.points ?? 0) + 5 })
    .eq('id', authorId)

  // Notify post author via factory (handles self-reply guard internally)
  {
    const replierName = profileRow.display_name ?? profileRow.full_name ?? 'Someone'
    const channelSlug = (post.channels as { slug: string } | null)?.slug ?? 'general'

    void notifyReply({
      postAuthorId:    post.author_id,
      replyAuthorId:   authorId,
      replyAuthorName: replierName,
      channelSlug,
      postId:          params.postId,
      replySnippet:    replyBody,
    })
  }

  return NextResponse.json(toReply(reply as Parameters<typeof toReply>[0]), { status: 201 })
}
