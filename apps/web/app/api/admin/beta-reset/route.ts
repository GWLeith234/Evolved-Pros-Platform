export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'

// POST /api/admin/beta-reset — reversible closed-beta gate.
// Body: { action: 'pause' | 'restore-all' } or { action: 'restore', userId }.
//
// Pause flips access_status='suspended' for every non-admin, non-comped member
// (keyed on comp_promo_code_id IS NULL, NOT tier_status — comped Friends of
// George keep access). Admins are never touched. Nothing is deleted; restore
// flips access_status back to 'active'. Each affected user gets a
// tier_change_log row (direction 'beta_reset' / 'beta_restore') for audit —
// tier itself is unchanged, so old_tier == new_tier.

interface AffectedRow {
  id: string
  tier: string | null
}

async function logChanges(rows: AffectedRow[], direction: string) {
  if (rows.length === 0) return
  await (adminClient as any).from('tier_change_log').insert(
    rows.map(r => ({
      user_id: r.id,
      old_tier: r.tier,
      new_tier: r.tier,
      direction,
    })),
  )
}

export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: { action?: unknown; userId?: unknown }
  try {
    body = (await request.json()) as { action?: unknown; userId?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const action = typeof body.action === 'string' ? body.action : ''

  if (action === 'pause') {
    // Snapshot who will be affected (for the audit log), then suspend them.
    const { data: affected, error: selErr } = await adminClient
      .from('users')
      .select('id, tier')
      .neq('role', 'admin')
      .is('comp_promo_code_id', null)
      .eq('access_status', 'active')
    if (selErr) return NextResponse.json({ error: 'Could not read members.' }, { status: 500 })

    const rows = (affected ?? []) as AffectedRow[]
    const { error: updErr } = await adminClient
      .from('users')
      .update({ access_status: 'suspended' })
      .neq('role', 'admin')
      .is('comp_promo_code_id', null)
      .eq('access_status', 'active')
    if (updErr) return NextResponse.json({ error: 'Could not pause access.' }, { status: 500 })

    await logChanges(rows, 'beta_reset')
    return NextResponse.json({ ok: true, affected: rows.length })
  }

  if (action === 'restore-all') {
    const { data: affected } = await adminClient
      .from('users')
      .select('id, tier')
      .eq('access_status', 'suspended')
    const rows = (affected ?? []) as AffectedRow[]

    const { error: updErr } = await adminClient
      .from('users')
      .update({ access_status: 'active' })
      .eq('access_status', 'suspended')
    if (updErr) return NextResponse.json({ error: 'Could not restore access.' }, { status: 500 })

    await logChanges(rows, 'beta_restore')
    return NextResponse.json({ ok: true, restored: rows.length })
  }

  if (action === 'restore') {
    const userId = typeof body.userId === 'string' ? body.userId : ''
    if (!userId) return NextResponse.json({ error: 'Missing userId.' }, { status: 422 })

    const { data: row } = await adminClient
      .from('users')
      .select('id, tier')
      .eq('id', userId)
      .eq('access_status', 'suspended')
      .maybeSingle()

    const { error: updErr } = await adminClient
      .from('users')
      .update({ access_status: 'active' })
      .eq('id', userId)
    if (updErr) return NextResponse.json({ error: 'Could not restore member.' }, { status: 500 })

    if (row) await logChanges([row as AffectedRow], 'beta_restore')
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 422 })
}
