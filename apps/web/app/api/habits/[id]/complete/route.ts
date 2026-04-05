import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId  = user.id
  const habitId = params.id
  if (!habitId) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const today = new Date().toISOString().split('T')[0]

  // Verify the habit belongs to this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: habit } = await (adminClient as any)
    .from('habit_stacks')
    .select('id')
    .eq('id', habitId)
    .eq('user_id', userId)
    .single()

  if (!habit) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Insert completion — 23505 = unique constraint (already done today) → treat as success
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
