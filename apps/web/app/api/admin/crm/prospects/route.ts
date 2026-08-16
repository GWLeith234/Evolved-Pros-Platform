export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import {
  CRM_SELECT_COLS,
  CRM_STAGE_META,
  isConsentBasis,
  isCrmStage,
  isCrmStatus,
  isHttpUrl,
  normalizeTags,
  type CrmStage,
} from '@/lib/admin/crm'

/** Postgres unique_violation — the uq_crm_prospects_email index from 076. */
const PG_UNIQUE_VIOLATION = '23505'

/** GET /api/admin/crm/prospects — list all prospects (optional ?stage=) */
export async function GET(request: Request) {
  const auth = await requireAdminApi()
  if (auth instanceof Response) return auth

  const { searchParams } = new URL(request.url)
  const stageParam = searchParams.get('stage')
  // ?keynote=1 — narrows to keynote-interested rows, served by the partial
  // index on keynote_interest WHERE true from migration 076.
  const keynoteOnly = searchParams.get('keynote') === '1'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (adminClient as any)
    .from('crm_prospects')
    .select(CRM_SELECT_COLS)
    .order('updated_at', { ascending: false })

  if (stageParam && isCrmStage(stageParam)) {
    query = query.eq('stage', stageParam)
  }
  if (keynoteOnly) {
    query = query.eq('keynote_interest', true)
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

  // ── Enrichment fields (migration 076), all optional on create ────────────
  if (body.consent_basis !== undefined && !isConsentBasis(body.consent_basis)) {
    return NextResponse.json(
      { error: "consent_basis must be one of: express, implied, unknown" },
      { status: 422 },
    )
  }
  if (body.tags !== undefined && !Array.isArray(body.tags)) {
    return NextResponse.json({ error: 'tags must be an array of strings' }, { status: 422 })
  }
  for (const field of ['linkedin_url', 'avatar_url'] as const) {
    const v = body[field]
    if (v !== undefined && v !== null && v !== '' && !isHttpUrl(v)) {
      return NextResponse.json(
        { error: `${field} must be an http(s) URL` },
        { status: 422 },
      )
    }
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
    title: typeof body.title === 'string' ? body.title.trim() || null : null,
    linkedin_url: isHttpUrl(body.linkedin_url) ? body.linkedin_url.trim() : null,
    avatar_url: isHttpUrl(body.avatar_url) ? body.avatar_url.trim() : null,
    location: typeof body.location === 'string' ? body.location.trim() || null : null,
    tags: normalizeTags(body.tags),
    consent_basis: isConsentBasis(body.consent_basis) ? body.consent_basis : 'unknown',
    keynote_interest: body.keynote_interest === true,
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
    // uq_crm_prospects_email (076) — one prospect per email, case-insensitive.
    if (error.code === PG_UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: `A prospect with the email ${email} already exists.` },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ prospect: data }, { status: 201 })
}
