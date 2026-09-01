export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

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
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.is_completed !== 'boolean') {
    return NextResponse.json({ error: 'is_completed (boolean) is required' }, { status: 422 })
  }

  const isCompleted = body.is_completed as boolean
  const completedAt = isCompleted ? new Date().toISOString() : null

  const { data, error } = await supabase
    .from('weekly_commitments')
    .update({ is_completed: isCompleted, completed_at: completedAt })
    .eq('id', id)
    .eq('user_id', profile.id) // ownership guard
    .select('id, commitment, is_completed, completed_at')
    .single()

  if (error) {
    console.error('[PATCH /api/commitments/[id]]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ commitment: data })
}
