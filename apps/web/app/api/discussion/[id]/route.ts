export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

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

  // Service-role RPC: increment_discussion_like is SECURITY DEFINER with no
  // auth.uid() check. The browser key must not be able to call it.
  const { data, error } = await adminClient.rpc('increment_discussion_like', { post_id: id })

  if (error) {
    console.error('[PATCH /api/discussion/[id]] increment_discussion_like failed', { id, error })
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 })
  }

  return NextResponse.json({ post: data })
}
