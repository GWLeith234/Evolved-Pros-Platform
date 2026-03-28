import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@evolved-pros/db'
import { adminClient } from '@/lib/supabase/admin'
import type { Channel, Post, LeaderboardEntry, MemberSummary } from './types'

type SB = SupabaseClient<Database>

export async function fetchCurrentUserProfile(supabase: SB, userId: string) {
  const { data } = await supabase
    .from('users')
    .select('display_name, full_name, avatar_url, tier, points')
    .eq('id', userId)
    .single()
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

export async function fetchPosts(
  supabase: SB,
  { channelSlug, userId, limit = 20 }: { channelSlug: string; userId: string; limit?: number }
): Promise<{ posts: Post[]; nextCursor: string | null; hasMore: boolean }> {
  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('slug', channelSlug)
    .single()

  if (!channel) return { posts: [], nextCursor: null, hasMore: false }

  // Use adminClient so posts from null-tier / newly-onboarded users aren't
  // dropped by RLS on the INNER join with users. Auth (getUser) is verified
  // by the caller; likes/bookmarks below stay on the user-scoped SSR client.
  const { data: rows } = await adminClient
    .from('posts')
    .select('id, channel_id, body, pillar_tag, is_pinned, like_count, reply_count, created_at, users(id, display_name, full_name, avatar_url)')
    .eq('channel_id', channel.id)
    .eq('is_pinned', false)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  const allRows = rows ?? []
  const hasMore = allRows.length > limit
  const page = allRows.slice(0, limit)
  const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].created_at : null

  const postIds = page.map(r => r.id)
  const [likesRes, bookmarksRes] = await Promise.all([
    postIds.length > 0
      ? supabase.from('post_likes').select('post_id').eq('user_id', userId).in('post_id', postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
    postIds.length > 0
      ? supabase.from('post_bookmarks').select('post_id').eq('user_id', userId).in('post_id', postIds)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ])

  const likedIds = new Set((likesRes.data ?? []).map(l => l.post_id))
  const bookmarkedIds = new Set((bookmarksRes.data ?? []).map(b => b.post_id))

  const posts = page.map(row => {
    const author = row.users as { id: string; display_name: string | null; full_name: string | null; avatar_url: string | null } | null
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
        id: author?.id ?? '',
        displayName: author?.display_name ?? author?.full_name ?? 'Member',
        avatarUrl: author?.avatar_url ?? null,
      },
      isLiked: likedIds.has(row.id),
      isBookmarked: bookmarkedIds.has(row.id),
    } satisfies Post
  })

  return { posts, nextCursor, hasMore }
}

export async function fetchPinnedPost(
  supabase: SB,
  channelSlug: string
): Promise<{ label: string; body: string } | null> {
  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('slug', channelSlug)
    .single()

  if (!channel) return null

  const { data } = await adminClient
    .from('posts')
    .select('body, users(display_name, full_name)')
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
  const { data } = await supabase
    .from('users')
    .select('id, display_name, full_name, avatar_url, points')
    .order('points', { ascending: false })
    .limit(10)

  const entries = (data ?? []).map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    displayName: u.display_name ?? u.full_name ?? 'Member',
    avatarUrl: u.avatar_url,
    points: u.points,
    isCurrentUser: u.id === currentUserId,
  }))

  // If current user isn't in top 10, fetch their rank
  const inList = entries.some(e => e.isCurrentUser)
  if (!inList) {
    const { data: currentUser } = await supabase
      .from('users')
      .select('id, display_name, full_name, avatar_url, points')
      .eq('id', currentUserId)
      .single()

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
    tier: u.tier,
    points: u.points,
  }))
}
