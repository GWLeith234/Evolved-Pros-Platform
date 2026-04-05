import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

async function getAuthUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(request: Request) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id
  const today = new Date().toISOString().split('T')[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [habitsRes, completionsRes] = await Promise.all([
    (adminClient as any)
      .from('habit_stacks')
      .select('id, name, time_of_day, sort_order, course_id, created_at')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
    (adminClient as any)
      .from('habit_completions')
      .select('habit_stack_id')
      .eq('user_id', userId)
      .eq('completed_on', today),
  ])

  const courseId = new URL(request.url).searchParams.get('course_id')
  const habits = habitsRes.data ?? []
  const filteredHabits = courseId
    ? habits.filter((h: { course_id: string | null }) => h.course_id === courseId)
    : habits

  const completedIds = (completionsRes.data ?? []).map(
    (c: { habit_stack_id: string }) => c.habit_stack_id
  )

  return NextResponse.json({ habits: filteredHabits, completedIds })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id
  const body = await req.json() as {
    name?: string
    time_of_day?: string
    frequency?: string
    course_id?: string | null
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  // Accept 'frequency' from modal (daily/weekdays) mapped to time_of_day
  const time_of_day = body.time_of_day ?? (body.frequency === 'weekdays' ? 'PM' : 'AM')
  const course_id = body.course_id ?? null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (adminClient as any)
    .from('habit_stacks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) >= 7) {
    return NextResponse.json({ error: 'Maximum 7 habits allowed' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (adminClient as any)
    .from('habit_stacks')
    .insert({ user_id: userId, course_id, name, time_of_day, sort_order: count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ habit: data }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = user.id
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('habit_stacks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
