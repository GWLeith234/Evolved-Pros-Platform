export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: { postId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // RLS-FIX: resolve public.users.id by email so author/admin checks compare
  // against the same id space as posts.author_id (which FKs public.users.id).
  const { data: profile } = await adminClient
    .from('users')
    .select('id, role')
    .eq('email', user.email)
    .single()
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch post to check ownership
  const { data: post } = await adminClient
    .from('posts')
    .select('author_id')
    .eq('id', params.postId)
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  if (post.author_id !== profile.id && profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await adminClient.from('posts').delete().eq('id', params.postId)
  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

  return new NextResponse(null, { status: 204 })
}
