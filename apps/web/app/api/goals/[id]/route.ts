export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { adminClient } from '@/lib/supabase/admin'
import { notifyWigNudge } from '@/lib/notifications/create'
import { WIG_DEDUPE_MS, crossedMilestones, wigActionUrl, wigCopy } from '@/lib/notifications/intents'

/**
 * PATCH /api/goals/[id]
 * Log progress on a quarterly goal. Body: { progress_pct: number (0–100) }.
 * Ownership is enforced against public.users.id (profile.id).
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const raw = body.progress_pct
  const progressPct = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isFinite(progressPct) || progressPct < 0 || progressPct > 100) {
    return NextResponse.json(
      { error: 'progress_pct must be a number between 0 and 100' },
      { status: 422 },
    )
  }

  // Load current progress to compute weekly_delta from the previous value.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = adminClient as any
  const { data: existing, error: fetchErr } = await sb
    .from('quarterly_goals')
    .select('id, progress_pct, weekly_delta, user_id')
    .eq('id', id)
    .eq('user_id', profile.id)
    .maybeSingle()

  if (fetchErr) {
    console.error('[PATCH /api/goals/[id]] select', fetchErr)
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }
  if (!existing) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
  }

  const prev = typeof existing.progress_pct === 'number' ? existing.progress_pct : 0
  const next = Math.round(progressPct)
  const weeklyDelta = next - prev

  const { data, error } = await sb
    .from('quarterly_goals')
    .update({
      progress_pct: next,
      weekly_delta: weeklyDelta,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', profile.id)
    .select('id, title, period, progress_pct, weekly_delta, pillar')
    .single()

  if (error) {
    console.error('[PATCH /api/goals/[id]] update', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const title = typeof data.title === 'string' ? data.title : 'your WIG'
  for (const mark of crossedMilestones(prev, next)) {
    const copy = wigCopy('milestone', { title, milestone: mark })
    void notifyWigNudge({
      userId:    profile.id,
      title:     copy.title,
      body:      copy.body,
      actionUrl: wigActionUrl('milestone', { milestone: mark }),
      sinceMs:   WIG_DEDUPE_MS,
    })
  }

  return NextResponse.json({ goal: data })
}
