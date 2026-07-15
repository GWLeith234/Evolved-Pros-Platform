import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@evolved-pros/db'
import { adminClient } from '@/lib/supabase/admin'
import type { Channel, Post, LeaderboardEntry, MemberSummary, CommunityAd, WeeklyLeaderboardEntry } from './types'

type SB = SupabaseClient<Database>

export async function fetchCurrentUserProfile(supabase: SB, userId: string) {
  const { data } = await supabase
    .from('users')
    .select('display_name, full_name, avatar_url, tier, points, role, current_pillar')
    .eq('id', userId)
    .maybeSingle()
  return data
}

export async function fetchChannels(supabase: SB): Promise<Channel[]> {
  const { data } = await supabase
    .from('channels')
    .select('id, slug, name, pillar_number')
    .order('sort_order')
  return (data ?? []).map(c => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    pillarNumber: c.pillar_number,
    unreadCount: 0,
  }))
}

type PostRow = {
  id: string
  channel_id: string
  body: string
  pillar_tag: string | null
  post_type: string | null
  is_pinned: boolean
  like_count: number
  reply_count: number
  created_at: string
  users: { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null; tier?: string | null } | null
}

type LikeRow = { post_id: string; reaction_type: string | null }

async function hydratePostMeta(
  supabase: SB,
  userId: string,
  rows: PostRow[],
  limit: number
) {
  const page = rows.slice(0, limit)
  const postIds = page.map(r => r.id)

  // SPRINT D — reactions live in post_reactions and comments in replies; the
  // old post_likes table and the denormalized posts.like_count/reply_count are
  // dead (0). Count live rows so Community (and Home, which reads the same
  // tables) show real numbers.
  const [userLikesRes, bookmarksRes, allLikesRes, repliesRes] = await Promise.all([
    postIds.length > 0
      ? supabase.from('post_reactions').select('post_id, reaction_type').eq('user_id', userId).in('post_id', postIds) as unknown as Promise<{ data: LikeRow[] | null }>
      : Promise.resolve({ data: [] as LikeRow[] }),
    postIds.length > 0
      ? supabase.from('post_bookmarks').select('post_id').eq('user_id', userId).in('post_id', postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    postIds.length > 0
      ? adminClient.from('post_reactions').select('post_id, reaction_type').in('post_id', postIds) as unknown as Promise<{ data: LikeRow[] | null }>
      : Promise.resolve({ data: [] as LikeRow[] }),
    postIds.length > 0
      ? adminClient.from('replies').select('post_id').in('post_id', postIds) as unknown as Promise<{ data: { post_id: string }[] | null }>
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ])

  const myReactionMap = new Map<string, string>(
    (userLikesRes.data ?? []).map(l => [l.post_id, l.reaction_type ?? 'thumbs_up'])
  )
  const bookmarkedIds = new Set((bookmarksRes.data ?? []).map(b => b.post_id))

  const reactionCountsByPost = new Map<string, Map<string, number>>()
  for (const like of allLikesRes.data ?? []) {
    const type = like.reaction_type ?? 'thumbs_up'
    if (!reactionCountsByPost.has(like.post_id)) reactionCountsByPost.set(like.post_id, new Map())
    const m = reactionCountsByPost.get(like.post_id)!
    m.set(type, (m.get(type) ?? 0) + 1)
  }

  const replyCountByPost = new Map<string, number>()
  for (const r of repliesRes.data ?? []) {
    replyCountByPost.set(r.post_id, (replyCountByPost.get(r.post_id) ?? 0) + 1)
  }

  return page.map(row => {
    const author = row.users
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
      likeCount: reactions.reduce((s, r) => s + r.count, 0),
      replyCount: replyCountByPost.get(row.id) ?? 0,
      createdAt: row.created_at,
      author: {
        id: author?.id ?? '',
        displayName: author?.display_name ?? author?.full_name ?? 'Member',
        avatarUrl: author?.avatar_url ?? null,
        tier: author?.tier ?? null,
      },
      isLiked: myReactionMap.has(row.id),
      myReaction: myReactionMap.get(row.id) ?? null,
      reactions,
      isBookmarked: bookmarkedIds.has(row.id),
    } satisfies Post
  })
}

export async function fetchPosts(
  supabase: SB,
  { channelSlug, userId, limit = 20 }: { channelSlug: string; userId: string; limit?: number }
): Promise<{ posts: Post[]; nextCursor: string | null; hasMore: boolean }> {
  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('slug', channelSlug)
    .maybeSingle()

  if (!channel) return { posts: [], nextCursor: null, hasMore: false }

  const { data: rows } = await adminClient
    .from('posts')
    .select('id, channel_id, body, pillar_tag, post_type, is_pinned, like_count, reply_count, created_at, users!posts_author_id_fkey(id, display_name, full_name, avatar_url, tier)')
    .eq('channel_id', channel.id)
    .eq('is_pinned', false)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  const allRows = (rows ?? []) as PostRow[]
  const hasMore = allRows.length > limit
  const nextCursor = hasMore && allRows.length > 0 ? allRows[limit - 1].created_at : null

  const posts = await hydratePostMeta(supabase, userId, allRows, limit)

  return { posts, nextCursor, hasMore }
}

export async function fetchAllPosts(
  supabase: SB,
  { userId, limit = 20, cursor }: { userId: string; limit?: number; cursor?: string | null }
): Promise<{ posts: Post[]; nextCursor: string | null; hasMore: boolean }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = adminClient
    .from('posts')
    .select('id, channel_id, body, pillar_tag, post_type, is_pinned, like_count, reply_count, created_at, users!posts_author_id_fkey(id, display_name, full_name, avatar_url, tier)')
    .eq('is_pinned', false)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: rows } = await query

  const allRows = (rows ?? []) as PostRow[]
  const hasMore = allRows.length > limit
  const nextCursor = hasMore && allRows.length > 0 ? allRows[limit - 1].created_at : null

  const posts = await hydratePostMeta(supabase, userId, allRows, limit)

  return { posts, nextCursor, hasMore }
}

export async function fetchPinnedAnnouncement(
  supabase: SB
): Promise<{ label: string; body: string } | null> {
  // Try new post_type='announce' first, then fall back to is_pinned=true (legacy)
  const { data } = await adminClient
    .from('posts')
    .select('body, post_type, users!posts_author_id_fkey(display_name, full_name)')
    .eq('is_pinned', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  const author = data.users as { display_name: string | null; full_name: string | null } | null
  const authorName = author?.display_name ?? author?.full_name ?? 'George'

  return { label: `Pinned · From ${authorName}`, body: data.body }
}

export async function fetchPinnedPost(
  supabase: SB,
  channelSlug: string
): Promise<{ label: string; body: string } | null> {
  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('slug', channelSlug)
    .maybeSingle()

  if (!channel) return null

  const { data } = await adminClient
    .from('posts')
    .select('body, users!posts_author_id_fkey(display_name, full_name)')
    .eq('channel_id', channel.id)
    .eq('is_pinned', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null

  const author = data.users as { display_name: string | null; full_name: string | null } | null
  const authorName = author?.display_name ?? author?.full_name ?? 'Admin'

  return { label: `Pinned — From ${authorName}`, body: data.body }
}

export async function fetchLeaderboard(supabase: SB, currentUserId: string): Promise<LeaderboardEntry[]> {
  // Top-10 and the current user's own row don't depend on each other —
  // fetch them in parallel so the second read isn't gated on the first.
  const [{ data }, { data: currentUser }] = await Promise.all([
    supabase
      .from('users')
      .select('id, display_name, full_name, avatar_url, points')
      .order('points', { ascending: false })
      .limit(10),
    supabase
      .from('users')
      .select('id, display_name, full_name, avatar_url, points')
      .eq('id', currentUserId)
      .maybeSingle(),
  ])

  const entries = (data ?? []).map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    displayName: u.display_name ?? u.full_name ?? 'Member',
    avatarUrl: u.avatar_url,
    points: u.points,
    isCurrentUser: u.id === currentUserId,
  }))

  const inList = entries.some(e => e.isCurrentUser)
  if (!inList) {
    if (currentUser) {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gt('points', currentUser.points)

      entries.push({
        rank: (count ?? 0) + 1,
        userId: currentUser.id,
        displayName: currentUser.display_name ?? currentUser.full_name ?? 'Member',
        avatarUrl: currentUser.avatar_url,
        points: currentUser.points,
        isCurrentUser: true,
      })
    }
  }

  return entries
}

export async function fetchActiveMembers(supabase: SB, limit = 5): Promise<MemberSummary[]> {
  const { data } = await supabase
    .from('users')
    .select('id, display_name, full_name, avatar_url, role_title, location, tier, points')
    .eq('tier_status', 'active')
    .order('updated_at', { ascending: false })
    .limit(limit)

  return (data ?? []).map(u => ({
    id: u.id,
    displayName: u.display_name ?? u.full_name ?? 'Member',
    avatarUrl: u.avatar_url,
    roleTitle: u.role_title,
    location: u.location,
    // DB column is free-text string|null; assert to the MemberSummary union at
    // this boundary (badge rendering tolerates unknown tiers).
    tier: u.tier as 'pro' | 'vip' | 'community' | null,
    points: u.points,
  }))
}

export async function fetchCommunityAds(): Promise<CommunityAd[]> {
  // Pull a wider pool so rotation can diversify rail vs feed placements.
  const { data } = await adminClient
    .from('platform_ads')
    .select('id, image_url, headline, body_copy, tool_name, cta_text, link_url, click_url, sponsor_name')
    .eq('is_active', true)
    .order('sort_order')
    .limit(12)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any[]
}

// MR1: weekly leaderboard. No points-history table exists, so we rank by
// post count over the last 7 days as the spec proxy. The user's lifetime
// points come from users.points; weeklyPosts is both the ranking signal
// and the displayed weekly delta.
export async function fetchWeeklyLeaderboard(
  supabase: SB,
  currentUserId: string,
): Promise<WeeklyLeaderboardEntry[]> {
  // Fast path: SQL aggregate (migration 048). The function name isn't in the
  // generated types yet, so the call is cast; remove the cast after running
  // `supabase gen types`. Falls back to in-app aggregation if the function is
  // absent (e.g. deployed before the migration is applied).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rpcRows, error: rpcError } = await (supabase as any)
    .rpc('weekly_leaderboard', { p_limit: 5 })
  if (!rpcError && Array.isArray(rpcRows)) {
    return (rpcRows as Array<{
      user_id: string
      display_name: string | null
      full_name: string | null
      avatar_url: string | null
      points: number | null
      weekly_posts: number
    }>).map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      displayName: r.display_name ?? r.full_name ?? 'Member',
      avatarUrl: r.avatar_url ?? null,
      points: r.points ?? 0,
      weeklyPosts: Number(r.weekly_posts) || 0,
      isCurrentUser: r.user_id === currentUserId,
    }))
  }

  // Fallback: original in-app aggregation (kept until 048 is applied).
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const { data: postRows } = await supabase
    .from('posts')
    .select('author_id')
    .gte('created_at', since)

  const counts = new Map<string, number>()
  for (const row of postRows ?? []) {
    const id = (row as { author_id: string | null }).author_id
    if (!id) continue
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  if (counts.size === 0) return []

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, full_name, avatar_url, points')
    .in('id', topIds)

  const byId = new Map((users ?? []).map(u => [u.id, u]))

  return topIds.map((id, i) => {
    const u = byId.get(id)
    return {
      rank: i + 1,
      userId: id,
      displayName: u?.display_name ?? u?.full_name ?? 'Member',
      avatarUrl: u?.avatar_url ?? null,
      points: u?.points ?? 0,
      weeklyPosts: counts.get(id) ?? 0,
      isCurrentUser: id === currentUserId,
    }
  })
}
