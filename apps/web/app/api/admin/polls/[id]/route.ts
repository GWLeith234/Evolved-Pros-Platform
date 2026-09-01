export const dynamic = 'force-dynamic'

import { requireAdminApi } from '@/lib/admin/helpers'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  for (const key of ['question', 'context', 'status', 'closes_at']) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await adminClient
    .from('polls')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  // Delete options and votes first (cascade may handle this, but be safe)
  await adminClient.from('poll_votes').delete().eq('poll_id', params.id)
  await adminClient.from('poll_options').delete().eq('poll_id', params.id)
  const { error } = await adminClient.from('polls').delete().eq('id', params.id)

  if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
