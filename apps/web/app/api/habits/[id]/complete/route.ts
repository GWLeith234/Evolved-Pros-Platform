import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const habitId = params.id
  if (!habitId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const today = new Date().toISOString().split('T')[0]

  // Verify the habit belongs to this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: habit } = await (supabase as any)
    .from('habit_stacks')
    .select('id')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single()

  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Upsert idempotent completion
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('habit_completions')
    .upsert(
      { habit_id: habitId, user_id: user.id, completed_date: today },
      { onConflict: 'habit_id,completed_date' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, completed_date: today })
}
