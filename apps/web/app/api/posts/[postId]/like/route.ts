export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { notifyLike } from '@/lib/notifications/create'

export async function POST(
  _request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if already liked
  const { data: existing } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', params.postId)
    .eq('user_id', user.id)
    .single()

  const { data: post } = await supabase
    .from('posts')
    .select('like_count, author_id')
    .eq('id', params.postId)
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  if (existing) {
    // Unlike
    await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', params.postId)
      .eq('user_id', user.id)

    const newCount = Math.max(0, post.like_count - 1)
    await supabase
      .from('posts')
      .update({ like_count: newCount })
      .eq('id', params.postId)

    return NextResponse.json({ liked: false, likeCount: newCount })
  } else {
    // Like
    await supabase
      .from('post_likes')
      .insert({ post_id: params.postId, user_id: user.id })

    const newCount = post.like_count + 1
    await supabase
      .from('posts')
      .update({ like_count: newCount })
      .eq('id', params.postId)

    // Award 2 points to post author (not self-liking)
    if (post.author_id !== user.id) {
      const { data: author } = await supabase
        .from('users')
        .select('points')
        .eq('id', post.author_id)
        .single()
      if (author) {
        await supabase
          .from('users')
          .update({ points: author.points + 2 })
          .eq('id', post.author_id)
      }
    }

    // Notify post author of the like (handles self-like guard internally)
    {
      const { data: likerProfile } = await supabase
        .from('users')
        .select('display_name, full_name')
        .eq('id', user.id)
        .single()
      const { data: channel } = await supabase
        .from('posts')
        .select('channels(slug)')
        .eq('id', params.postId)
        .single()
      const likerName = likerProfile?.display_name ?? likerProfile?.full_name ?? 'Someone'
      const channelSlug = (channel?.channels as { slug: string } | null)?.slug ?? 'general'

      void notifyLike({
        postAuthorId: post.author_id,
        likerUserId:  user.id,
        likerName,
        channelSlug,
        postId:       params.postId,
      })
    }

    return NextResponse.json({ liked: true, likeCount: newCount })
  }
}
