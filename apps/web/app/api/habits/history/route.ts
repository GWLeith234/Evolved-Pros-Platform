import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = Math.min(90, Math.max(7, parseInt(req.nextUrl.searchParams.get('days') ?? '30', 10)))

  // Build the date range
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  const startStr = start.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]

  const [completionsRes, totalHabitsRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('habit_completions')
      .select('completed_date')
      .eq('user_id', user.id)
      .gte('completed_date', startStr)
      .lte('completed_date', endStr),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('habit_stacks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  // Group completions by date
  const countByDate: Record<string, number> = {}
  for (const row of (completionsRes.data ?? []) as { completed_date: string }[]) {
    countByDate[row.completed_date] = (countByDate[row.completed_date] ?? 0) + 1
  }

  const totalHabits = totalHabitsRes.count ?? 0

  // Build a full array for every day in range
  const daily: { date: string; completed: number; total: number; pct: number }[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const dateStr = cursor.toISOString().split('T')[0]
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
