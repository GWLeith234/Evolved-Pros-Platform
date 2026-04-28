import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
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

  const userId = user.id
  const days   = Math.min(90, Math.max(7, parseInt(req.nextUrl.searchParams.get('days') ?? '30', 10)))

  const end   = new Date()
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  const startStr = start.toISOString().split('T')[0]
  const endStr   = end.toISOString().split('T')[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [completionsRes, totalHabitsRes] = await Promise.all([
    (adminClient as any)
      .from('habit_completions')
      .select('completed_on')
      .eq('user_id', userId)
      .gte('completed_on', startStr)
      .lte('completed_on', endStr),
    (adminClient as any)
      .from('habit_stacks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])

  const countByDate: Record<string, number> = {}
  for (const row of (completionsRes.data ?? []) as { completed_on: string }[]) {
    countByDate[row.completed_on] = (countByDate[row.completed_on] ?? 0) + 1
  }

  const totalHabits = totalHabitsRes.count ?? 0

  const daily: { date: string; completed: number; total: number; pct: number }[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const dateStr   = cursor.toISOString().split('T')[0]
    const completed = countByDate[dateStr] ?? 0
    daily.push({
      date: dateStr,
      completed,
      total: totalHabits,
      pct: totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  const daysWithAnyCompletion = daily.filter(d => d.completed > 0).length
  const overallPct = days > 0 ? Math.round((daysWithAnyCompletion / days) * 100) : 0

  return NextResponse.json({ daily, totalHabits, overallPct })
}
