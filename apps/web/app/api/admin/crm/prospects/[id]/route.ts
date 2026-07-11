export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { isCrmStage, isCrmStatus } from '@/lib/admin/crm'

const SELECT_COLS =
  'id, full_name, email, phone, company, notes, stage, status, source, last_contacted_at, user_id, created_by, created_at, updated_at'

type RouteCtx = { params: { id: string } }

/** PATCH /api/admin/crm/prospects/[id] — update fields / stage / mark contacted */
export async function PATCH(request: Request, { params }: RouteCtx) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { id } = params
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (typeof body.full_name === 'string' && body.full_name.trim()) {
    patch.full_name = body.full_name.trim()
  }
  if (typeof body.email === 'string' && body.email.trim().includes('@')) {
    patch.email = body.email.trim().toLowerCase()
  }
  if (typeof body.phone === 'string') {
    patch.phone = body.phone.trim() || null
  }
  if (typeof body.company === 'string') {
    patch.company = body.company.trim() || null
  }
  if (typeof body.notes === 'string') {
    patch.notes = body.notes.trim() || null
  }
  if (typeof body.source === 'string') {
    patch.source = body.source.trim() || null
  }
  if (typeof body.stage === 'string' && isCrmStage(body.stage)) {
    patch.stage = body.stage
  }
  if (typeof body.status === 'string' && isCrmStatus(body.status)) {
    patch.status = body.status
  }

  // Quick action: mark contacted
  if (body.mark_contacted === true) {
    patch.last_contacted_at = new Date().toISOString()
    if (!patch.status) patch.status = 'contacted'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('crm_prospects')
    .update(patch)
    .eq('id', id)
    .select(SELECT_COLS)
    .maybeSingle()

  if (error) {
    console.error('[PATCH /api/admin/crm/prospects/[id]]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Prospect not found' }, { status: 404 })
  }

  return NextResponse.json({ prospect: data })
}

/** DELETE /api/admin/crm/prospects/[id] */
export async function DELETE(_request: Request, { params }: RouteCtx) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { id } = params
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any).from('crm_prospects').delete().eq('id', id)

  if (error) {
    console.error('[DELETE /api/admin/crm/prospects/[id]]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
