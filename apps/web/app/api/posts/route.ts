import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { Post } from '@/lib/community/types'

export const dynamic = 'force-dynamic'

function toPost(
  row: {
    id: string
    channel_id: string
    body: string
    pillar_tag: string | null
    post_type: string | null
    is_pinned: boolean
    like_count: number
    reply_count: number
    created_at: string
    users: { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null; tier: string | null } | null
  },
  myReactionMap: Map<string, string>,
  reactionCountsByPost: Map<string, Map<string, number>>,
  bookmarkedIds: Set<string>
): Post {
  const reactionMap = reactionCountsByPost.get(row.id)
  const reactions = reactionMap
    ? Array.from(reactionMap.entries()).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)
    : []
  return {
    id: row.id,
    channelId: row.channel_id,
    body: row.body,
    pillarTag: row.pillar_tag as Post['pillarTag'],
    postType: (row.post_type ?? 'update') as Post['postType'],
    isPinned: row.is_pinned,
    likeCount: row.like_count,
    replyCount: row.reply_count,
    createdAt: row.created_at,
    author: {
      id: row.users?.id ?? '',
      displayName: row.users?.full_name ?? row.users?.display_name ?? 'Member',
      avatarUrl: row.users?.avatar_url ?? null,
      tier: row.users?.tier ?? null,
    },
    isLiked: myReactionMap.has(row.id),
    myReaction: myReactionMap.get(row.id) ?? null,
    reactions,
    isBookmarked: bookmarkedIds.has(row.id),
  }
}

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const channelSlug = searchParams.get('channelSlug')
  const cursor = searchParams.get('cursor') ?? ''
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

  // Build base query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = adminClient
    .from('posts')
    .select('id, channel_id, body, pillar_tag, post_type, is_pinned, like_count, reply_count, created_at, users!posts_author_id_fkey(id, display_name, full_name, avatar_url, tier)')
    .eq('is_pinned', false)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  // If channelSlug provided (and not 'all'), filter by channel
  if (channelSlug && channelSlug !== 'all') {
    const { data: channel } = await supabase
      .from('channels')
      .select('id')
      .eq('slug', channelSlug)
      .single()

    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    query = query.eq('channel_id', channel.id)
  }

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: rows, error } = await query

  if (error) return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })

  const postRows = rows ?? []
  const hasMore = postRows.length > limit
  const page = postRows.slice(0, limit)
  const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].created_at : null

  const postIds = page.map((p: { id: string }) => p.id)
  type LikeRow = { post_id: string; reaction_type: string | null }
  const [userLikesResult, bookmarksResult, allLikesResult] = await Promise.all([
    postIds.length > 0
      ? supabase.from('post_likes').select('post_id, reaction_type').eq('user_id', user.id).in('post_id', postIds) as Promise<{ data: LikeRow[] | null }>
      : Promise.resolve({ data: [] as LikeRow[] }),
    postIds.length > 0
      ? supabase.from('post_bookmarks').select('post_id').eq('user_id', user.id).in('post_id', postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    postIds.length > 0
      ? adminClient.from('post_likes').select('post_id, reaction_type').in('post_id', postIds) as Promise<{ data: LikeRow[] | null }>
      : Promise.resolve({ data: [] as LikeRow[] }),
  ])

  const myReactionMap = new Map<string, string>(
    (userLikesResult.data ?? []).map(l => [l.post_id, l.reaction_type ?? 'thumbs_up'])
  )
  const bookmarkedIds = new Set((bookmarksResult.data ?? []).map(b => b.post_id))

  const reactionCountsByPost = new Map<string, Map<string, number>>()
  for (const like of allLikesResult.data ?? []) {
    const type = like.reaction_type ?? 'thumbs_up'
    if (!reactionCountsByPost.has(like.post_id)) reactionCountsByPost.set(like.post_id, new Map())
    const m = reactionCountsByPost.get(like.post_id)!
    m.set(type, (m.get(type) ?? 0) + 1)
  }

  const posts = page.map((row: Parameters<typeof toPost>[0]) =>
    toPost(row, myReactionMap, reactionCountsByPost, bookmarkedIds)
  )

  return NextResponse.json({ posts, nextCursor, hasMore })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { channelId?: unknown; body?: unknown; pillarTag?: unknown; postType?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const channelId = typeof body.channelId === 'string' ? body.channelId : null
  const postBody = typeof body.body === 'string' ? body.body.trim() : ''
  const pillarTag = typeof body.pillarTag === 'string' ? body.pillarTag : null
  const postType = typeof body.postType === 'string' ? body.postType : 'update'

  if (!channelId) return NextResponse.json({ error: 'channelId is required' }, { status: 422 })
  if (postBody.length < 10) return NextResponse.json({ error: 'Post must be at least 10 characters' }, { status: 422 })
  if (postBody.length > 5000) return NextResponse.json({ error: 'Post exceeds 5000 characters' }, { status: 422 })

  const validPillarTags = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
  const validatedTag = pillarTag && validPillarTags.includes(pillarTag) ? pillarTag : null

  const validPostTypes = ['update', 'question', 'win', 'announce']
  const validatedPostType = validPostTypes.includes(postType) ? postType : 'update'

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      channel_id: channelId,
      body: postBody,
      pillar_tag: validatedTag as 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | null,
      post_type: validatedPostType,
    })
    .select('id, channel_id, body, pillar_tag, post_type, is_pinned, like_count, reply_count, created_at, users!posts_author_id_fkey(id, display_name, full_name, avatar_url, tier)')
    .single()

  if (error || !post) {
    console.error('[posts] insert failed — error:', JSON.stringify(error), '| post is null:', post === null)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }

  supabase.rpc('increment_points', { user_id: user.id, amount: 10 }).then(({ error }) => {
    if (error) {
      console.warn('[posts] increment_points RPC failed:', error.message, '— skipping points award')
    }
  }).catch(err => {
    console.warn('[posts] increment_points threw:', err)
  })

  const result: Post = toPost(
    post as Parameters<typeof toPost>[0],
    new Map<string, string>(),
    new Map<string, Map<string, number>>(),
    new Set<string>()
  )

  return NextResponse.json(result, { status: 201 })
}
