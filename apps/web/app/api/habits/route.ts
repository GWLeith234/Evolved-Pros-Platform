import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courseId = req.nextUrl.searchParams.get('course_id')
  const today = new Date().toISOString().split('T')[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let habitsQuery = (supabase as any)
    .from('habit_stacks')
    .select('id, name, time_of_day, sort_order, course_id, created_at')
    .eq('user_id', user.id)
    .order('sort_order')

  if (courseId) {
    habitsQuery = habitsQuery.eq('course_id', courseId)
  }

  const [habitsRes, completionsRes] = await Promise.all([
    habitsQuery,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('habit_completions')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('completed_on', today),
  ])

  const habits = (habitsRes.data ?? []) as { id: string; name: string; time_of_day: string; sort_order: number; course_id: string | null; created_at: string }[]
  const completedIds = ((completionsRes.data ?? []) as { habit_id: string }[]).map(c => c.habit_id)

  return NextResponse.json({ habits, completedIds })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { name?: string; time_of_day?: string; course_id?: string | null; sort_order?: number }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const time_of_day = body.time_of_day ?? 'AM'
  const course_id = body.course_id ?? null

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  // Count existing habits for this user (max 7)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('habit_stacks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= 7) {
    return NextResponse.json({ error: 'Maximum 7 habits allowed' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('habit_stacks')
    .insert({ user_id: user.id, course_id, name, time_of_day, sort_order: count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ habit: data }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // RLS handles ownership verification
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('habit_stacks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
