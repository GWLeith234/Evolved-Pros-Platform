export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'

export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const postId = typeof body.postId === 'string' ? body.postId : ''
  const action = typeof body.action === 'string' ? body.action : ''

  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 422 })
  if (!['approve', 'reject', 'edit'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve, reject, or edit' }, { status: 422 })
  }

  const update: Record<string, unknown> = {}

  if (action === 'approve') {
    update.status = 'scheduled' // stays scheduled, cron will publish at scheduled_at
  } else if (action === 'reject') {
    update.status = 'rejected'
  } else if (action === 'edit') {
    const newBody = typeof body.body === 'string' ? body.body.trim() : null
    if (newBody) update.body = newBody
    update.status = 'scheduled'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('posts')
    .update(update)
    .eq('id', postId)
    .select('id, body, status, scheduled_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}
