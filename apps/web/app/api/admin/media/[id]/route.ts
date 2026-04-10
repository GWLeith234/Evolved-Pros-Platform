import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/helpers'
import { adminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  const { data, error } = await adminClient
    .from('media_stories')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // If publishing for the first time, set published_at
  if (body.is_published === true && !body.published_at) {
    body.published_at = new Date().toISOString()
  }

  const { data, error } = await adminClient
    .from('media_stories')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const check = await requireAdminApi()
  if (check instanceof Response) return check

  const { error } = await adminClient
    .from('media_stories')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
