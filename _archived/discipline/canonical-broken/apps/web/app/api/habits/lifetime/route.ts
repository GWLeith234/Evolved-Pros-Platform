import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET() {
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

  const end   = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  const startStr = start.toISOString().split('T')[0]
  const endStr   = end.toISOString().split('T')[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (adminClient as any)
    .from('daily_scores')
    .select('date, score, pct')
    .eq('user_id', user.id)
    .gte('date', startStr)
    .lte('date', endStr)
    .order('date', { ascending: true })

  const byDate: Record<string, { score: number; pct: number }> = {}
  for (const row of (data ?? []) as { date: string; score: number; pct: number }[]) {
    byDate[row.date] = { score: row.score, pct: row.pct }
  }

  const scores: { date: string; score: number; pct: number }[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const d = cursor.toISOString().split('T')[0]
    scores.push({ date: d, score: byDate[d]?.score ?? 0, pct: byDate[d]?.pct ?? 0 })
    cursor.setDate(cursor.getDate() + 1)
  }

  return NextResponse.json({ scores })
}
