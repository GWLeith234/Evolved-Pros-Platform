import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { toPostMedia } from './media'
import type { Post } from './types'

/**
 * Loader for the /community/{id} permalink (SPRINT CM-1).
 *
 * Shapes the row into the exact Post the feed card consumes, so the permalink
 * renders through PostCardV2 with no permalink-specific styling.
 */

/* A uuid path segment. Anything else is a channel slug, not a post id, so the
   caller falls through to the channel page instead of hitting Postgres with a
   malformed uuid. */
export const POST_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const SELECT =
  'id, channel_id, body, pillar_tag, post_type, is_pinned, like_count, reply_count, created_at, media_url, media_kind, media_width, media_height, users!posts_author_id_fkey(id, display_name, full_name, avatar_url, tier)'

/* DB CHECK stores clap/mind; the UI calls them hands/mindblown. Same mapping
   as GET /api/posts. */
const DB_TO_EMOJI: Record<string, string> = {
  fire: 'fire', hundred: 'hundred', clap: 'hands', heart: 'heart', mind: 'mindblown',
}

type Row = {
  id: string
  channel_id: string
  body: string
  pillar_tag: string | null
  post_type: string | null
  is_pinned: boolean
  like_count: number
  reply_count: number
  created_at: string
  media_url: string | null
  media_kind: string | null
  media_width: number | null
  media_height: number | null
  users: {
    id: string
    display_name: string | null
    full_name: string | null
    avatar_url: string | null
    tier: string | null
  } | null
}

export async function fetchPermalinkRow(postId: string): Promise<Row | null> {
  if (!POST_ID_RE.test(postId)) return null
  const { data } = await adminClient.from('posts').select(SELECT).eq('id', postId).maybeSingle()
  return (data as Row | null) ?? null
}

export async function fetchPermalinkPost(postId: string, viewerId: string): Promise<Post | null> {
  const row = await fetchPermalinkRow(postId)
  if (!row) return null

  const [{ data: allReactions }, { data: myReactions }] = await Promise.all([
    adminClient.from('post_reactions').select('reaction_type').eq('post_id', row.id),
    adminClient.from('post_reactions').select('reaction_type').eq('post_id', row.id).eq('user_id', viewerId),
  ])

  const counts = new Map<string, number>()
  for (const r of (allReactions ?? []) as { reaction_type: string }[]) {
    const type = DB_TO_EMOJI[r.reaction_type] ?? r.reaction_type
    counts.set(type, (counts.get(type) ?? 0) + 1)
  }
  const reactions = Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  const mine = (myReactions ?? []) as { reaction_type: string }[]
  const myReaction = mine[0] ? (DB_TO_EMOJI[mine[0].reaction_type] ?? mine[0].reaction_type) : null

  return {
    id: row.id,
    channelId: row.channel_id,
    body: row.body,
    pillarTag: row.pillar_tag as Post['pillarTag'],
    postType: (row.post_type ?? 'update') as Post['postType'],
    isPinned: row.is_pinned,
    likeCount: reactions.reduce((s, r) => s + r.count, 0),
    replyCount: row.reply_count ?? 0,
    createdAt: row.created_at,
    author: {
      id: row.users?.id ?? '',
      displayName: row.users?.full_name ?? row.users?.display_name ?? 'Member',
      avatarUrl: row.users?.avatar_url ?? null,
      tier: row.users?.tier ?? null,
    },
    isLiked: myReaction !== null,
    myReaction,
    reactions,
    isBookmarked: false,
    media: toPostMedia(row),
  }
}
