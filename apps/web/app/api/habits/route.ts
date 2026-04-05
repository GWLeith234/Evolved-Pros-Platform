import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get public user ID via email lookup (auth UUID ≠ public users UUID)
  const { data: profile } = await adminClient
    .from('users')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!profile) return NextResponse.json({ habits: [], completedIds: [] })

  const userId = profile.id
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

  // Fetch habits (adminClient bypasses RLS)
  const { data: habits } = await (adminClient as any)
    .from('habit_stacks')
    .select('id, name, time_of_day, sort_order, course_id, created_at')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  // Fetch TODAY's completions — column is habit_stack_id
  const { data: completions, error: compError } = await (adminClient as any)
    .from('habit_completions')
    .select('habit_stack_id')
    .eq('user_id', userId)
    .eq('completed_on', today)

  console.log('Habit completions for today:', today, completions, compError)

  // Apply course_id filter after fetch if requested
  const courseId = new URL(request.url).searchParams.get('course_id')
  const filteredHabits = courseId
    ? (habits ?? []).filter((h: any) => h.course_id === courseId)
    : (habits ?? [])

  const completedIds = completions?.map((c: any) => c.habit_stack_id) ?? []

  return NextResponse.json({ habits: filteredHabits, completedIds })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get public UUID
  const { data: profile } = await adminClient
    .from('users')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const userId = profile.id
  const body = await req.json() as { name?: string; time_of_day?: string; frequency?: string; course_id?: string | null }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  // Accept both 'time_of_day' (legacy) and 'frequency' (modal) field names
  const time_of_day = body.time_of_day ?? (body.frequency === 'weekdays' ? 'PM' : 'AM')
  const course_id = body.course_id ?? null

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  // Count existing habits for this user (max 7)
  const { count } = await (adminClient as any)
    .from('habit_stacks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) >= 7) {
    return NextResponse.json({ error: 'Maximum 7 habits allowed' }, { status: 400 })
  }

  const { data, error } = await (adminClient as any)
    .from('habit_stacks')
    .insert({ user_id: userId, course_id, name, time_of_day, sort_order: count ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ habit: data }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get public UUID
  const { data: profile } = await adminClient
    .from('users')
    .select('id')
    .eq('email', user.email!)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const userId = profile.id
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await (adminClient as any)
    .from('habit_stacks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
