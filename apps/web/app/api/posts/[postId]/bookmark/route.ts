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

  // Check if already bookmarked
  const { data: existing } = await supabase
    .from('post_bookmarks')
    .select('post_id')
    .eq('post_id', params.postId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase
      .from('post_bookmarks')
      .delete()
      .eq('post_id', params.postId)
      .eq('user_id', user.id)

    return NextResponse.json({ bookmarked: false })
  } else {
    const { error } = await supabase
      .from('post_bookmarks')
      .insert({ post_id: params.postId, user_id: user.id })

    if (error) return NextResponse.json({ error: 'Bookmark failed' }, { status: 500 })

    return NextResponse.json({ bookmarked: true })
  }
}
