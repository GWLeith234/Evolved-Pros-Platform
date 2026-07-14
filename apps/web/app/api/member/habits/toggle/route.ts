export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function POST(request: Request) {
  const supabase = createClient()
  // habits / habit_completions FK their user_id to public.users.id, so key on
  // the email-resolved profile id — not the raw auth UID (auth.uid() ===
  // public.users.id is not guaranteed for future Vendasta signups).
  const profile = await resolveCurrentUser(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const habitId = typeof body.habit_id === 'string' ? body.habit_id.trim() : ''
  const dateRaw = typeof body.date === 'string' ? body.date.trim() : ''
  const date = DATE_RE.test(dateRaw) ? dateRaw : new Date().toISOString().split('T')[0]
  if (!habitId) return NextResponse.json({ error: 'habit_id is required' }, { status: 422 })

  // Ownership guard: habits.user_id is public.users.id, so match on profile.id.
  const { data: habit } = await adminClient
    .from('habits')
    .select('id, user_id')
    .eq('id', habitId)
    .maybeSingle()
  if (!habit || habit.user_id !== profile.id) {
    return NextResponse.json({ error: 'Habit not found' }, { status: 404 })
  }

  const { data: existing } = await adminClient
    .from('habit_completions')
    .select('id')
    .eq('habit_id', habitId)
    .eq('completed_date', date)
    .maybeSingle()

  if (existing) {
    const { error } = await adminClient
      .from('habit_completions')
      .delete()
      .eq('id', existing.id)
    if (error) {
      console.error('[POST /api/member/habits/toggle] delete', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ completed: false })
  }

  // habit_completions has a legacy NOT NULL `completed_on` column with no
  // default — mirror completed_date into it so inserts succeed.
  const { error: insertErr } = await adminClient
    .from('habit_completions')
    .insert({
      habit_id: habitId,
      user_id: profile.id,
      completed_date: date,
      completed_on: date,
    })
  if (insertErr) {
    console.error('[POST /api/member/habits/toggle] insert', insertErr)
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }
  return NextResponse.json({ completed: true })
}
