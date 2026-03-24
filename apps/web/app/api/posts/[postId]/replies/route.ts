import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
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
      displayName: row.users?.display_name ?? row.users?.full_name ?? 'Member',
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
    .select('id, post_id, body, created_at, users(id, display_name, full_name, avatar_url)')
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { body?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const replyBody = typeof body.body === 'string' ? body.body.trim() : ''
  if (replyBody.length < 1) return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 422 })
  if (replyBody.length > 2000) return NextResponse.json({ error: 'Reply exceeds 2000 characters' }, { status: 422 })

  // Verify post exists and get author + channel
  const { data: post } = await supabase
    .from('posts')
    .select('author_id, reply_count, channels(slug)')
    .eq('id', params.postId)
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  const { data: reply, error } = await supabase
    .from('replies')
    .insert({ post_id: params.postId, author_id: user.id, body: replyBody })
    .select('id, post_id, body, created_at, users(id, display_name, full_name, avatar_url)')
    .single()

  if (error || !reply) return NextResponse.json({ error: 'Failed to create reply' }, { status: 500 })

  // Increment reply_count on post
  await supabase
    .from('posts')
    .update({ reply_count: post.reply_count + 1 })
    .eq('id', params.postId)

  // Award 5 points to reply author
  const { data: authorData } = await supabase
    .from('users')
    .select('points')
    .eq('id', user.id)
    .single()
  if (authorData) {
    await supabase
      .from('users')
      .update({ points: authorData.points + 5 })
      .eq('id', user.id)
  }

  // Notify post author via factory (handles self-reply guard internally)
  {
    const { data: replierProfile } = await supabase
      .from('users')
      .select('display_name, full_name')
      .eq('id', user.id)
      .single()
    const replierName = replierProfile?.display_name ?? replierProfile?.full_name ?? 'Someone'
    const channelSlug = (post.channels as { slug: string } | null)?.slug ?? 'general'

    void notifyReply({
      postAuthorId:    post.author_id,
      replyAuthorId:   user.id,
      replyAuthorName: replierName,
      channelSlug,
      postId:          params.postId,
      replySnippet:    replyBody,
    })
  }

  return NextResponse.json(toReply(reply as Parameters<typeof toReply>[0]), { status: 201 })
}
