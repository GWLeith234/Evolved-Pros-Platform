import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { fetchCoursesWithProgress } from '@/lib/academy/fetchers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const courses = await fetchCoursesWithProgress(supabase, user.id)

  const totalLessons = courses.reduce((s, c) => s + c.totalLessons, 0)
  const completedLessons = courses.reduce((s, c) => s + c.completedLessons, 0)
  const overallProgressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return NextResponse.json({ courses, overallProgressPct })
}
