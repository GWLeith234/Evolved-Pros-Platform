export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import {
  CRM_SELECT_COLS,
  CRM_STAGE_META,
  isCrmStage,
  isCrmStatus,
  type CrmStage,
} from '@/lib/admin/crm'

/** GET /api/admin/crm/prospects — list all prospects (optional ?stage=) */
export async function GET(request: Request) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { searchParams } = new URL(request.url)
  const stageParam = searchParams.get('stage')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (adminClient as any)
    .from('crm_prospects')
    .select(CRM_SELECT_COLS)
    .order('updated_at', { ascending: false })

  if (stageParam && isCrmStage(stageParam)) {
    query = query.eq('stage', stageParam)
  }

  const { data, error } = await query
  if (error) {
    console.error('[GET /api/admin/crm/prospects]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ prospects: data ?? [] })
}

/** POST /api/admin/crm/prospects — create a prospect */
export async function POST(request: Request) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!fullName) {
    return NextResponse.json({ error: 'full_name is required' }, { status: 422 })
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 422 })
  }

  const stage: CrmStage =
    typeof body.stage === 'string' && isCrmStage(body.stage) ? body.stage : 'lead'
  const status =
    typeof body.status === 'string' && isCrmStatus(body.status) ? body.status : 'active'

  let valueMonthly: number | null = null
  if (body.value_monthly !== undefined && body.value_monthly !== null && body.value_monthly !== '') {
    const n = Number(body.value_monthly)
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: 'value_monthly must be a non-negative number' }, { status: 422 })
    }
    valueMonthly = n
  } else {
    // Default value from stage catalog
    valueMonthly = CRM_STAGE_META[stage].mrr
  }

  let nextFollowUp: string | null = null
  if (typeof body.next_follow_up_at === 'string' && body.next_follow_up_at.trim()) {
    const d = new Date(body.next_follow_up_at)
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: 'Invalid next_follow_up_at' }, { status: 422 })
    }
    nextFollowUp = d.toISOString()
  }

  const row = {
    full_name: fullName,
    email,
    phone: typeof body.phone === 'string' ? body.phone.trim() || null : null,
    company: typeof body.company === 'string' ? body.company.trim() || null : null,
    notes: typeof body.notes === 'string' ? body.notes.trim() || null : null,
    source: typeof body.source === 'string' ? body.source.trim() || null : null,
    stage,
    status,
    value_monthly: valueMonthly,
    next_follow_up_at: nextFollowUp,
    created_by: auth.userId,
    updated_at: new Date().toISOString(),
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('crm_prospects')
    .insert(row)
    .select(CRM_SELECT_COLS)
    .single()

  if (error) {
    console.error('[POST /api/admin/crm/prospects]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ prospect: data }, { status: 201 })
}
