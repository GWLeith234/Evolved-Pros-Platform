export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  // Auth check — ensure caller is logged in (likes don't need ownership check)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { data, error } = await supabase.rpc('increment_discussion_like', { post_id: id })

  if (error) {
    // Fallback: manual increment if RPC doesn't exist
    const { data: current } = await supabase
      .from('discussion_posts')
      .select('like_count')
      .eq('id', id)
      .single()

    const { data: updated, error: updateError } = await supabase
      .from('discussion_posts')
      .update({ like_count: (current?.like_count ?? 0) + 1 })
      .eq('id', id)
      .select('id, like_count')
      .single()

    if (updateError) {
      console.error('[PATCH /api/discussion/[id]]', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ post: updated })
  }

  return NextResponse.json({ post: data })
}
