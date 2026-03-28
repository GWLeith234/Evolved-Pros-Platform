export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { notifyLike } from '@/lib/notifications/create'

const VALID_REACTIONS = ['heart', 'thumbs_up', 'clap', 'thumbs_down', 'celebration'] as const
type ReactionType = typeof VALID_REACTIONS[number]

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Read reaction_type from body; fall back to 'thumbs_up'
  let reactionType: ReactionType = 'thumbs_up'
  try {
    const body = await request.json()
    if (typeof body.reaction_type === 'string' && VALID_REACTIONS.includes(body.reaction_type as ReactionType)) {
      reactionType = body.reaction_type as ReactionType
    }
  } catch { /* no body — use default */ }

  const { data: post } = await supabase
    .from('posts')
    .select('like_count, author_id')
    .eq('id', params.postId)
    .single()
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  // Check if user already has any reaction on this post
  const { data: existing } = await supabase
    .from('post_likes')
    .select('post_id, reaction_type')
    .eq('post_id', params.postId)
    .eq('user_id', user.id)
    .maybeSingle() as { data: { post_id: string; reaction_type: string | null } | null }

  let liked = true
  let myReaction: string | null = reactionType
  let newLikeCount = post.like_count

  if (existing) {
    const sameType = existing.reaction_type === reactionType
    if (sameType) {
      // Toggle off — remove reaction
      await supabase.from('post_likes').delete().eq('post_id', params.postId).eq('user_id', user.id)
      newLikeCount = Math.max(0, post.like_count - 1)
      liked = false
      myReaction = null
    } else {
      // Change to a different reaction — update type, like_count unchanged
      await supabase
        .from('post_likes')
        .update({ reaction_type: reactionType } as never)
        .eq('post_id', params.postId)
        .eq('user_id', user.id)
    }
  } else {
    // New reaction
    await supabase
      .from('post_likes')
      .insert({ post_id: params.postId, user_id: user.id, reaction_type: reactionType } as never)
    newLikeCount = post.like_count + 1

    // Award 2 points to post author (not self-reacting)
    if (post.author_id !== user.id) {
      supabase.rpc('increment_points', { user_id: post.author_id, amount: 2 }).catch(() => {})
    }

    // Notify author
    const [likerProfile, channelData] = await Promise.all([
      supabase.from('users').select('display_name, full_name').eq('id', user.id).single().then(r => r.data),
      supabase.from('posts').select('channels(slug)').eq('id', params.postId).single().then(r => r.data),
    ])
    const likerName = likerProfile?.display_name ?? likerProfile?.full_name ?? 'Someone'
    const channelSlug = (channelData?.channels as { slug: string } | null)?.slug ?? 'general'
    void notifyLike({ postAuthorId: post.author_id, likerUserId: user.id, likerName, channelSlug, postId: params.postId })
  }

  // Update like_count on the post
  await supabase.from('posts').update({ like_count: newLikeCount }).eq('id', params.postId)

  // Fetch updated per-reaction counts (adminClient to see all users' reactions)
  const { data: allLikes } = await adminClient
    .from('post_likes')
    .select('reaction_type')
    .eq('post_id', params.postId) as { data: { reaction_type: string | null }[] | null }

  const reactionMap: Record<string, number> = {}
  for (const like of allLikes ?? []) {
    const t = like.reaction_type ?? 'thumbs_up'
    reactionMap[t] = (reactionMap[t] ?? 0) + 1
  }
  const reactions = Object.entries(reactionMap)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({ liked, likeCount: newLikeCount, myReaction, reactions })
}
