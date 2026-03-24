import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Post } from '@/lib/community/types'

export const dynamic = 'force-dynamic'

function toPost(
  row: {
    id: string
    channel_id: string
    body: string
    pillar_tag: string | null
    is_pinned: boolean
    like_count: number
    reply_count: number
    created_at: string
    users: { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null } | null
  },
  likedIds: Set<string>,
  bookmarkedIds: Set<string>
): Post {
  return {
    id: row.id,
    channelId: row.channel_id,
    body: row.body,
    pillarTag: row.pillar_tag as Post['pillarTag'],
    isPinned: row.is_pinned,
    likeCount: row.like_count,
    replyCount: row.reply_count,
    createdAt: row.created_at,
    author: {
      id: row.users?.id ?? '',
      displayName: row.users?.display_name ?? row.users?.full_name ?? 'Member',
      avatarUrl: row.users?.avatar_url ?? null,
    },
    isLiked: likedIds.has(row.id),
    isBookmarked: bookmarkedIds.has(row.id),
  }
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const channelSlug = searchParams.get('channelSlug') ?? 'general'
  const cursor = searchParams.get('cursor') ?? ''
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

  // Resolve channel
  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('slug', channelSlug)
    .single()

  if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })

  let query = supabase
    .from('posts')
    .select('id, channel_id, body, pillar_tag, is_pinned, like_count, reply_count, created_at, users(id, display_name, full_name, avatar_url)')
    .eq('channel_id', channel.id)
    .eq('is_pinned', false)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: rows, error } = await query

  if (error) return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })

  const postRows = rows ?? []
  const hasMore = postRows.length > limit
  const page = postRows.slice(0, limit)
  const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].created_at : null

  // Fetch liked + bookmarked post IDs for current user in this set
  const postIds = page.map(p => p.id)
  const [likesResult, bookmarksResult] = await Promise.all([
    postIds.length > 0
      ? supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase
          .from('post_bookmarks')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds)
      : Promise.resolve({ data: [] }),
  ])

  const likedIds = new Set((likesResult.data ?? []).map(l => l.post_id))
  const bookmarkedIds = new Set((bookmarksResult.data ?? []).map(b => b.post_id))

  const posts = page.map(row =>
    toPost(row as Parameters<typeof toPost>[0], likedIds, bookmarkedIds)
  )

  return NextResponse.json({ posts, nextCursor, hasMore })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { channelId?: unknown; body?: unknown; pillarTag?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const channelId = typeof body.channelId === 'string' ? body.channelId : null
  const postBody = typeof body.body === 'string' ? body.body.trim() : ''
  const pillarTag = typeof body.pillarTag === 'string' ? body.pillarTag : null

  if (!channelId) return NextResponse.json({ error: 'channelId is required' }, { status: 422 })
  if (postBody.length < 10) return NextResponse.json({ error: 'Post must be at least 10 characters' }, { status: 422 })
  if (postBody.length > 5000) return NextResponse.json({ error: 'Post exceeds 5000 characters' }, { status: 422 })

  const validPillarTags = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
  const validatedTag = pillarTag && validPillarTags.includes(pillarTag) ? pillarTag : null

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      channel_id: channelId,
      body: postBody,
      pillar_tag: validatedTag as 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | null,
    })
    .select('id, channel_id, body, pillar_tag, is_pinned, like_count, reply_count, created_at, users(id, display_name, full_name, avatar_url)')
    .single()

  if (error || !post) return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })

  // Award 10 points to author
  await supabase.rpc('increment_points', { user_id: user.id, amount: 10 }).catch(() => {
    // Fallback if RPC not available
    supabase
      .from('users')
      .select('points')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          supabase.from('users').update({ points: data.points + 10 }).eq('id', user.id)
        }
      })
  })

  const result: Post = toPost(
    post as Parameters<typeof toPost>[0],
    new Set<string>(),
    new Set<string>()
  )

  return NextResponse.json(result, { status: 201 })
}
