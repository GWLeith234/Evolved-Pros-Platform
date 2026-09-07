export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { enqueueDueThanksNudges } from '@/lib/thanks/enqueue'

// GET /api/admin/thanks/nudge-queue — list pending_approval rows. No send.
export async function GET() {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  const { data, error } = await (adminClient as any)
    .from('community_thanks_nudge_queue')
    .select('id, invite_id, cadence_step, due_at, status, created_at, community_thanks_invites ( email, first_name, token, status )')
    .eq('status', 'pending_approval')
    .order('due_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Could not load the nudge queue.' }, { status: 500 })
  return NextResponse.json({ ok: true, rows: data ?? [] })
}

// POST /api/admin/thanks/nudge-queue
// { action: 'enqueue' }  → sweep due steps into pending_approval. Never sends.
// { action: 'cancel', queueIds: string[] }
export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  let body: { action?: unknown; queueIds?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const action = typeof body.action === 'string' ? body.action : ''

  if (action === 'cancel') {
    const queueIds = Array.isArray(body.queueIds) ? body.queueIds.map(String).filter(Boolean) : []
    if (queueIds.length === 0) {
      return NextResponse.json({ error: 'Pick queued nudges to cancel.' }, { status: 422 })
    }
    const { error } = await (adminClient as any)
      .from('community_thanks_nudge_queue')
      .update({ status: 'cancelled' })
      .in('id', queueIds)
      .eq('status', 'pending_approval')
    if (error) return NextResponse.json({ error: 'Could not cancel those nudges.' }, { status: 500 })
    return NextResponse.json({ ok: true, cancelled: queueIds.length })
  }

  if (action !== 'enqueue') {
    return NextResponse.json({ error: 'Unknown action. Use enqueue or cancel.' }, { status: 422 })
  }

  const sweep = await enqueueDueThanksNudges()
  return NextResponse.json({ ok: true, ...sweep, sent: 0 })
}
