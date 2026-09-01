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
  const allowed = ['title', 'company', 'location', 'job_type', 'salary_range', 'description', 'apply_url', 'category', 'is_featured', 'status']
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  const { data, error } = await adminClient
    .from('job_listings')
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

  const { error } = await adminClient
    .from('job_listings')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
