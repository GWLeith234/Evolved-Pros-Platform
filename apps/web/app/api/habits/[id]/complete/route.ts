import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
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

  // Verify the habit belongs to this user (adminClient bypasses RLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: habit } = await (adminClient as any)
    .from('habit_stacks')
    .select('id')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single()

  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Plain insert — column is habit_stack_id (not habit_id).
  // If already completed today the unique constraint fires (code 23505); treat as success.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('habit_completions')
    .insert({ habit_stack_id: habitId, user_id: user.id, completed_on: today })

  if (error && error.code !== '23505') {
    console.error('Habit complete error:', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, completed_on: today })
}
