export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { notifyLike } from '@/lib/notifications/create'

// Legacy CommunityFeed vocabulary → canonical post_reactions CHECK values.
const LEGACY_TO_DB: Record<string, string> = {
  heart:       'heart',
  thumbs_up:   'fire',
  clap:        'clap',
  celebration: 'hundred',
  // thumbs_down has no canonical fit — treat as remove
  fire:        'fire',
  hundred:     'hundred',
  mind:        'mind',
  hands:       'clap',
  mindblown:   'mind',
}

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let reactionType = 'fire'
  let explicitRemove = false
  try {
    const body = await request.json()
    if (typeof body.reaction_type === 'string' && body.reaction_type in LEGACY_TO_DB) {
      reactionType = LEGACY_TO_DB[body.reaction_type]
    }
    if (body.remove === true || body.reaction_type === 'thumbs_down') explicitRemove = true
  } catch { /* no body — default fire toggle */ }

  const mode = explicitRemove ? 'remove' : 'toggle'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any).rpc('toggle_post_reaction', {
    p_user_id: profile.id,
    p_post_id: params.postId,
    p_reaction_type: reactionType,
    p_mode: mode,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const row = (Array.isArray(data) ? data[0] : data) as {
    action: string
    my_reaction: string | null
    reaction_count: number
    reactions: Record<string, number>
    post_author_id: string
    points_awarded: boolean
  } | null

  if (!row) return NextResponse.json({ error: 'Failed' }, { status: 500 })

  const liked = row.my_reaction != null
  const reactions = Object.entries(row.reactions ?? {})
    .map(([type, count]) => ({ type, count: Number(count) || 0 }))
    .sort((a, b) => b.count - a.count)

  if (row.action === 'added' && row.post_author_id !== profile.id) {
    const { data: channelData } = await adminClient
      .from('posts')
      .select('channels(slug)')
      .eq('id', params.postId)
      .single()
    const likerName = profile.display_name ?? profile.full_name ?? 'Someone'
    const channelSlug = (channelData?.channels as { slug: string } | null)?.slug ?? 'general'
    void notifyLike({
      postAuthorId: row.post_author_id,
      likerUserId: profile.id,
      likerName,
      channelSlug,
      postId: params.postId,
    })
  }

  return NextResponse.json({
    liked,
    likeCount: row.reaction_count,
    myReaction: row.my_reaction,
    reactions,
  })
}
