import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import type { Post } from '@/lib/community/types'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

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
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
  // COMMUNITY-SPRINT-2: source reactions from post_reactions (Sprint 0
  // table) instead of legacy post_likes. Sprint 0's migration backfilled
  // post_likes data into post_reactions, so counts stay accurate.
  // DB stores ('fire','hundred','clap','heart','mind') per Sprint 0 CHECK;
  // map clap→hands and mind→mindblown for the new UI.
  const DB_TO_EMOJI: Record<string, string> = {
    fire: 'fire', hundred: 'hundred', clap: 'hands', heart: 'heart', mind: 'mindblown',
  }
  type ReactionRow = { post_id: string; user_id: string; reaction_type: string }
  const [userReactionsResult, bookmarksResult, allReactionsResult] = await Promise.all([
    postIds.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (adminClient as any).from('post_reactions').select('post_id, user_id, reaction_type').eq('user_id', profile.id).in('post_id', postIds) as Promise<{ data: ReactionRow[] | null }>
      : Promise.resolve({ data: [] as ReactionRow[] }),
    postIds.length > 0
      ? supabase.from('post_bookmarks').select('post_id').eq('user_id', profile.id).in('post_id', postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    postIds.length > 0
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (adminClient as any).from('post_reactions').select('post_id, user_id, reaction_type').in('post_id', postIds) as Promise<{ data: ReactionRow[] | null }>
      : Promise.resolve({ data: [] as ReactionRow[] }),
  ])

  const myReactionMap = new Map<string, string>(
    (userReactionsResult.data ?? []).map(r => [r.post_id, DB_TO_EMOJI[r.reaction_type] ?? r.reaction_type])
  )
  const bookmarkedIds = new Set((bookmarksResult.data ?? []).map(b => b.post_id))

  const reactionCountsByPost = new Map<string, Map<string, number>>()
  for (const r of allReactionsResult.data ?? []) {
    const type = DB_TO_EMOJI[r.reaction_type] ?? r.reaction_type
    if (!reactionCountsByPost.has(r.post_id)) reactionCountsByPost.set(r.post_id, new Map())
    const m = reactionCountsByPost.get(r.post_id)!
    m.set(type, (m.get(type) ?? 0) + 1)
  }

  const posts = page.map((row: Parameters<typeof toPost>[0]) =>
    toPost(row, myReactionMap, reactionCountsByPost, bookmarkedIds)
  )

  return NextResponse.json({ posts, nextCursor, hasMore })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: {
    channelId?: unknown
    body?: unknown
    pillarTag?: unknown
    postType?: unknown
    pollId?: unknown
    pollOptions?: unknown
    kind?: unknown      // COMMUNITY-SPRINT-1: new composer
    pillar?: unknown    // COMMUNITY-SPRINT-1: integer 1-6 or null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const channelId = typeof body.channelId === 'string' ? body.channelId : null
  const postBody = typeof body.body === 'string' ? body.body.trim() : ''
  const pillarTag = typeof body.pillarTag === 'string' ? body.pillarTag : null
  const postType = typeof body.postType === 'string' ? body.postType : null
  const pollId = typeof body.pollId === 'string' ? body.pollId : null
  const pollOptions: string[] | null = Array.isArray(body.pollOptions)
    ? (body.pollOptions as unknown[])
        .filter((s): s is string => typeof s === 'string')
        .map(s => s.trim())
        .filter(Boolean)
    : null

  // New (Sprint 1) inputs.
  const rawKind = typeof body.kind === 'string' ? body.kind : null
  const rawPillar =
    typeof body.pillar === 'number' ? body.pillar :
    body.pillar === null ? null :
    undefined

  // Detect call site so legacy callers keep their min-10-char rule and new
  // composer callers (which gate on non-empty client-side) only need >0.
  const isNewComposer = rawKind !== null
  const minBodyLen = isNewComposer ? 1 : 10

  if (!channelId) return NextResponse.json({ error: 'channelId is required' }, { status: 422 })
  if (postBody.length < minBodyLen) {
    return NextResponse.json(
      { error: isNewComposer ? 'Post body required' : 'Post must be at least 10 characters' },
      { status: isNewComposer ? 400 : 422 },
    )
  }
  if (postBody.length > 5000) return NextResponse.json({ error: 'Post exceeds 5000 characters' }, { status: 422 })

  const VALID_KINDS = ['update', 'win', 'question', 'poll'] as const
  if (rawKind !== null && !VALID_KINDS.includes(rawKind as typeof VALID_KINDS[number])) {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
  }
  if (rawPillar !== undefined && rawPillar !== null) {
    if (!Number.isInteger(rawPillar) || rawPillar < 1 || rawPillar > 6) {
      return NextResponse.json({ error: 'Invalid pillar' }, { status: 400 })
    }
  }

  // Resolve canonical kind / pillar — prefer new fields, fall back to legacy.
  const validPostTypes = ['update', 'question', 'win', 'announce', 'poll']
  const legacyType = postType && validPostTypes.includes(postType) ? postType : null
  const kind: 'update' | 'win' | 'question' | 'poll' =
    (rawKind as 'update' | 'win' | 'question' | 'poll' | null) ??
    (legacyType === 'announce' ? 'update' : (legacyType as 'update' | 'win' | 'question' | 'poll' | null)) ??
    'update'

  const validPillarTags = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']
  const legacyTag = pillarTag && validPillarTags.includes(pillarTag) ? pillarTag : null
  const pillarInt: number | null =
    rawPillar !== undefined ? (rawPillar as number | null) :
    legacyTag ? Number(legacyTag.slice(1)) :
    null
  const pillarText: string | null =
    pillarInt !== null && pillarInt >= 1 && pillarInt <= 6 ? `p${pillarInt}` : legacyTag

  const authorId = profile.id

  // Poll creation: when kind === 'poll' and the composer sent options,
  // create the poll + poll_options rows first so we can attach the
  // resulting poll_id to the post insert below.
  let resolvedPollId: string | null = pollId
  if (kind === 'poll' && !resolvedPollId && pollOptions) {
    if (pollOptions.length < 2) {
      return NextResponse.json({ error: 'Polls need at least 2 options' }, { status: 422 })
    }
    if (pollOptions.length > 4) {
      return NextResponse.json({ error: 'Polls support at most 4 options' }, { status: 422 })
    }

    const { data: pollRow, error: pollErr } = await adminClient
      .from('polls')
      .insert({
        question: postBody.slice(0, 500),
        created_by: profile.id,
        status: 'active',
      } as never)
      .select('id')
      .single()

    if (pollErr || !pollRow) {
      console.error('[posts] poll insert failed:', pollErr?.message)
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })
    }

    const newPollId = (pollRow as { id: string }).id
    const optionRows = pollOptions.map((text, idx) => ({
      poll_id: newPollId,
      option_text: text.slice(0, 200),
      display_order: idx,
    }))
    const { error: optsErr } = await adminClient.from('poll_options').insert(optionRows as never)
    if (optsErr) {
      console.error('[posts] poll_options insert failed:', optsErr.message)
      return NextResponse.json({ error: 'Failed to create poll options' }, { status: 500 })
    }
    resolvedPollId = newPollId
  }

  const { data: post, error } = await adminClient
    .from('posts')
    .insert({
      author_id: authorId,
      channel_id: channelId,
      body: postBody,
      // Legacy columns — kept in sync so existing fetchers keep returning posts correctly.
      pillar_tag: pillarText as 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | null,
      post_type: legacyType ?? kind,
      // New columns (Sprint 0/1).
      kind,
      pillar: pillarInt,
      ...(resolvedPollId ? { poll_id: resolvedPollId } : {}),
    } as never)
    .select('id, channel_id, body, pillar_tag, post_type, is_pinned, like_count, reply_count, created_at, users!posts_author_id_fkey(id, display_name, full_name, avatar_url, tier)')
    .single()

  if (error || !post) {
    console.error('[posts] insert failed — error:', JSON.stringify(error), '| post is null:', post === null)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }

  // Award 10 points for posting (fire-and-forget — never block the response)
  try {
    const { error: rpcErr } = await supabase.rpc('increment_points', { user_id: profile.id, amount: 10 } as Record<string, unknown>)
    if (rpcErr) console.warn('[posts] increment_points failed:', rpcErr.message)
  } catch (err) {
    console.warn('[posts] increment_points exception:', err)
  }

  const result: Post = toPost(
    post as Parameters<typeof toPost>[0],
    new Map<string, string>(),
    new Map<string, Map<string, number>>(),
    new Set<string>()
  )

  return NextResponse.json(result, { status: 201 })
}
