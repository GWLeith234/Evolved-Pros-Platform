import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await adminClient
    .from('users')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!profile) return NextResponse.json({ currentStreak: 0, longestStreak: 0, lastCompletedDate: null })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (adminClient as any)
    .from('streak_records')
    .select('current_streak, longest_streak, last_completed_date')
    .eq('user_id', profile.id)
    .maybeSingle()

  return NextResponse.json({
    currentStreak:     data?.current_streak     ?? 0,
    longestStreak:     data?.longest_streak     ?? 0,
    lastCompletedDate: data?.last_completed_date ?? null,
  })
}
