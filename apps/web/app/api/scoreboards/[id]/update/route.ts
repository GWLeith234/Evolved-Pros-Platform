export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: scoreboard } = await supabase
    .from('scoreboards')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!scoreboard) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const updateDate = typeof body.update_date === 'string'
    ? body.update_date
    : new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('scoreboard_updates')
    .upsert(
      {
        scoreboard_id: params.id,
        user_id:       user.id,
        lag_value:     Number(body.lag_value    ?? 0),
        lead_1_count:  Number(body.lead_1_count ?? 0),
        lead_2_count:  Number(body.lead_2_count ?? 0),
        update_date:   updateDate,
      },
      { onConflict: 'scoreboard_id,update_date' },
    )
    .select('id, scoreboard_id, lag_value, lead_1_count, lead_2_count, update_date, created_at')
    .single()

  if (error || !data) {
    console.error('[POST /api/scoreboards/[id]/update]', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to save update' }, { status: 500 })
  }

  return NextResponse.json({ update: data }, { status: 201 })
}
