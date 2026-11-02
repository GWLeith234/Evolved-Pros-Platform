/**
 * Caller-controlled columns for POST /api/posts.
 *
 * The handler inserts through the service-role client. posts_guard_pin
 * (migration 084) returns immediately for service_role, so it never rewrites
 * post_type = 'announce' or is_pinned for that write. A signed-in member who
 * posts { postType: "announce", is_pinned: true, like_count: 9999, author_id }
 * would otherwise land an announcement (and any other column the insert
 * copied) as themselves. Announce stays admin-only, matching the composer
 * tab. Every other privileged column is server-owned and is not copied.
 */

export const MEMBER_POST_TYPES = ['update', 'question', 'win', 'poll'] as const

export const POST_DENIED_COLUMNS = [
  'id',
  'author_id',
  'is_pinned',
  'like_count',
  'reply_count',
  'reaction_count',
  'created_at',
  'updated_at',
  'ai_generated',
  'status',
  'scheduled_at',
] as const

export type CommunityPostKind = 'update' | 'win' | 'question' | 'poll'

export type CommunityPostInsert = {
  author_id: string
  channel_id: string
  body: string
  pillar_tag: string | null
  post_type: string
  kind: CommunityPostKind
  pillar: number | null
  poll_id?: string
}

/** post_type a caller may set. 'announce' is admin-only. */
export function acceptedPostType(value: unknown, isAdmin: boolean): string | null {
  if (typeof value !== 'string') return null
  if ((MEMBER_POST_TYPES as readonly string[]).includes(value)) return value
  if (isAdmin && value === 'announce') return value
  return null
}

/**
 * The exact row written to posts. `raw` is the request JSON; only postType
 * is read from it, and only when it is on the caller's allowlist. Denied
 * columns on `raw` are ignored.
 */
export function communityPostInsert(
  raw: Record<string, unknown>,
  ctx: {
    authorId: string
    channelId: string
    body: string
    pillarTag: string | null
    kind: CommunityPostKind
    pillar: number | null
    pollId: string | null
    isAdmin: boolean
  },
): CommunityPostInsert {
  const postType = acceptedPostType(raw.postType, ctx.isAdmin)
  const row: CommunityPostInsert = {
    author_id: ctx.authorId,
    channel_id: ctx.channelId,
    body: ctx.body,
    pillar_tag: ctx.pillarTag,
    post_type: postType ?? ctx.kind,
    kind: ctx.kind,
    pillar: ctx.pillar,
  }
  if (ctx.pollId) row.poll_id = ctx.pollId
  return row
}
