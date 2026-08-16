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
  isEnrichmentStatus,
  isHttpUrl,
  normalizeTags,
} from '@/lib/admin/crm'

/** Postgres unique_violation — the uq_crm_prospects_email index from 076. */
const PG_UNIQUE_VIOLATION = '23505'

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
    // When stage changes without an explicit value, align value to catalog default
    if (body.value_monthly === undefined) {
      patch.value_monthly = CRM_STAGE_META[body.stage].mrr
    }
  }
  if (typeof body.status === 'string' && isCrmStatus(body.status)) {
    patch.status = body.status
  }
  if (body.value_monthly !== undefined) {
    if (body.value_monthly === null || body.value_monthly === '') {
      patch.value_monthly = null
    } else {
      const n = Number(body.value_monthly)
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: 'value_monthly must be a non-negative number' }, { status: 422 })
      }
      patch.value_monthly = n
    }
  }
  if (body.next_follow_up_at !== undefined) {
    if (body.next_follow_up_at === null || body.next_follow_up_at === '') {
      patch.next_follow_up_at = null
    } else if (typeof body.next_follow_up_at === 'string') {
      const d = new Date(body.next_follow_up_at)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid next_follow_up_at' }, { status: 422 })
      }
      patch.next_follow_up_at = d.toISOString()
    }
  }

  // ── Enrichment fields (migration 076) ────────────────────────────────────
  for (const field of ['title', 'location'] as const) {
    if (typeof body[field] === 'string') {
      patch[field] = (body[field] as string).trim() || null
    }
  }
  for (const field of ['linkedin_url', 'avatar_url'] as const) {
    if (body[field] === undefined) continue
    if (body[field] === null || body[field] === '') {
      patch[field] = null
    } else if (isHttpUrl(body[field])) {
      patch[field] = (body[field] as string).trim()
    } else {
      return NextResponse.json({ error: `${field} must be an http(s) URL` }, { status: 422 })
    }
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      return NextResponse.json({ error: 'tags must be an array of strings' }, { status: 422 })
    }
    patch.tags = normalizeTags(body.tags)
  }
  if (body.consent_basis !== undefined) {
    if (!isConsentBasis(body.consent_basis)) {
      return NextResponse.json(
        { error: 'consent_basis must be one of: express, implied, unknown' },
        { status: 422 },
      )
    }
    patch.consent_basis = body.consent_basis
  }
  if (body.enrichment_status !== undefined) {
    if (!isEnrichmentStatus(body.enrichment_status)) {
      return NextResponse.json(
        { error: 'enrichment_status must be one of: none, pending, enriched, failed' },
        { status: 422 },
      )
    }
    patch.enrichment_status = body.enrichment_status
  }
  if (typeof body.keynote_interest === 'boolean') {
    patch.keynote_interest = body.keynote_interest
  }
  // Suppression toggle — nullable, so `null` is a meaningful "re-subscribe".
  if (body.unsubscribed_at !== undefined) {
    if (body.unsubscribed_at === null || body.unsubscribed_at === '') {
      patch.unsubscribed_at = null
    } else if (body.unsubscribed_at === true) {
      // Convenience: `true` means "unsubscribe now".
      patch.unsubscribed_at = new Date().toISOString()
    } else if (typeof body.unsubscribed_at === 'string') {
      const d = new Date(body.unsubscribed_at)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid unsubscribed_at' }, { status: 422 })
      }
      patch.unsubscribed_at = d.toISOString()
    } else {
      return NextResponse.json({ error: 'Invalid unsubscribed_at' }, { status: 422 })
    }
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
    .select(CRM_SELECT_COLS)
    .maybeSingle()

  if (error) {
    console.error('[PATCH /api/admin/crm/prospects/[id]]', error)
    // uq_crm_prospects_email (076) — email collides with another prospect.
    if (error.code === PG_UNIQUE_VIOLATION) {
      return NextResponse.json(
        { error: 'Another prospect already uses that email address.' },
        { status: 409 },
      )
    }
    // Graceful message if migration 061 not applied yet
    if (error.message?.includes('value_monthly') || error.message?.includes('next_follow_up')) {
      return NextResponse.json(
        { error: 'Run migration 061_crm_prospects_value_followup.sql then retry.' },
        { status: 500 },
      )
    }
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
