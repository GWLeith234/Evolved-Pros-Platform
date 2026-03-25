export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    return NextResponse.json({ liked: true, likeCount: newCount })
  }
}
