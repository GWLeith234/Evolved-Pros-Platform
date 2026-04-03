import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get public UUID (auth UUID ≠ public users UUID)
  const { data: profile } = await adminClient
    .from('users')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const userId = profile.id
  const habitId = params.id
  if (!habitId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const today = new Date().toISOString().split('T')[0]

  // Verify the habit belongs to this user (adminClient bypasses RLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: habit } = await (adminClient as any)
    .from('habit_stacks')
    .select('id')
    .eq('id', habitId)
    .eq('user_id', userId)
    .single()

  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Plain insert — habit_stack_id column, not habit_id.
  // 23505 = unique constraint (already completed today) → treat as success.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('habit_completions')
    .insert({ habit_stack_id: habitId, user_id: userId, completed_on: today })

  if (error && error.code !== '23505') {
    console.error('Habit complete error:', JSON.stringify(error))
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, completed_on: today })
}
