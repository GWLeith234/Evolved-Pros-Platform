export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(
  _request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS-FIX: post_bookmarks.user_id FKs public.users(id); resolve by email.
  const { data: profile } = await adminClient
    .from('users')
    .select('id')
    .eq('email', user.email)
    .single()
  const userId = profile?.id ?? user.id

  // Check if already bookmarked
  const { data: existing } = await adminClient
    .from('post_bookmarks')
    .select('post_id')
    .eq('post_id', params.postId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    await adminClient
      .from('post_bookmarks')
      .delete()
      .eq('post_id', params.postId)
      .eq('user_id', userId)

    return NextResponse.json({ bookmarked: false })
  } else {
    const { error } = await adminClient
      .from('post_bookmarks')
      .insert({ post_id: params.postId, user_id: userId } as never)

    if (error) return NextResponse.json({ error: 'Bookmark failed' }, { status: 500 })

    return NextResponse.json({ bookmarked: true })
  }
}
