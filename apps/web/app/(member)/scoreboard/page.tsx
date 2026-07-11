import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import {
  AccountabilityHub,
} from '@/components/home/AccountabilityHub'
import type { GoalForCard } from '@/components/home/GoalCard'
import type {
  DailyPulseHabit,
  DailyPulseCommitment,
} from '@/components/home/DailyPulseCard'
import { CommitmentTracker } from '@/components/academy/CommitmentTracker'
import { GoalCard } from '@/components/home/GoalCard'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Goals & Accountability — Evolved Pros',
  description:
    'Daily scoreboard, weekly commitments, and quarterly goals — the Accountability Hub.',
}

function getCurrentMonday(): string {
  const now = new Date()
  const ref = now.getDay() === 0 ? new Date(now.getTime() + 86_400_000) : now
  const day = ref.getDay()
  const diff = 1 - day
  const monday = new Date(ref)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(ref.getDate() + diff)
  const yyyy = monday.getFullYear()
  const mm = String(monday.getMonth() + 1).padStart(2, '0')
  const dd = String(monday.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00Z')
  if (Number.isNaN(start.getTime())) return weekStart
  return start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

async function fetchTodaysHabits(authUserId: string): Promise<DailyPulseHabit[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000).toISOString().split('T')[0]
    const [habitsRes, completionsRes] = await Promise.all([
      adminClient
        .from('habits')
        .select('id, name, pillar, sort_order')
        .eq('user_id', authUserId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      adminClient
        .from('habit_completions')
        .select('habit_id, completed_date')
        .eq('user_id', authUserId)
        .gte('completed_date', sixtyDaysAgo)
        .not('habit_id', 'is', null),
    ])
    const completedToday = new Set<string>()
    const recentCount: Record<string, number> = {}
    for (const c of completionsRes.data ?? []) {
      if (!c.habit_id) continue
      recentCount[c.habit_id] = (recentCount[c.habit_id] ?? 0) + 1
      if (c.completed_date === today) completedToday.add(c.habit_id)
    }
    return (habitsRes.data ?? []).map(h => ({
      id: h.id,
      name: h.name,
      pillar: h.pillar,
      completedToday: completedToday.has(h.id),
      recentCount: recentCount[h.id] ?? 0,
    }))
  } catch (err) {
    console.error('[scoreboard.fetchTodaysHabits]', err)
    return []
  }
}

async function fetchWeekCommitments(
  profileId: string,
  weekStart: string,
): Promise<DailyPulseCommitment[]> {
  try {
    const { data } = await adminClient
      .from('weekly_commitments')
      .select('id, commitment, is_completed, week_start, created_at')
      .eq('user_id', profileId)
      .eq('week_start', weekStart)
      .order('created_at', { ascending: true })
      .limit(10)
    return (data ?? []).map(c => ({
      id: c.id,
      commitment: c.commitment,
      is_completed: c.is_completed,
    }))
  } catch (err) {
    console.error('[scoreboard.fetchWeekCommitments]', err)
    return []
  }
}

async function fetchInProgressCourse(profileId: string) {
  const [courses, lessons, progress] = await Promise.all([
    adminClient
      .from('courses')
      .select('id, title, slug, sort_order, pillar_number')
      .eq('is_published', true)
      .order('sort_order'),
    adminClient
      .from('lessons')
      .select('id, course_id, title, slug, sort_order')
      .eq('is_published', true),
    adminClient
      .from('lesson_progress')
      .select('lesson_id, completed_at')
      .eq('user_id', profileId),
  ])

  const completed = new Set(
    (progress.data ?? [])
      .filter(p => p.completed_at)
      .map(p => p.lesson_id),
  )
  const touched = new Set((progress.data ?? []).map(p => p.lesson_id))

  const lessonsByCourse: Record<
    string,
    { id: string; title: string | null; slug: string | null; sort_order: number | null }[]
  > = {}
  for (const l of lessons.data ?? []) {
    if (!lessonsByCourse[l.course_id]) lessonsByCourse[l.course_id] = []
    lessonsByCourse[l.course_id].push(l)
  }
  for (const list of Object.values(lessonsByCourse)) {
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }

  const PILLAR_SLUG: Record<number, string> = {
    1: 'foundation',
    2: 'identity',
    3: 'mental-toughness',
    4: 'strategy',
    5: 'accountability',
    6: 'execution',
  }

  for (const c of courses.data ?? []) {
    const ls = lessonsByCourse[c.id] ?? []
    if (!ls.length) continue
    const done = ls.filter(l => completed.has(l.id)).length
    const anyTouched = ls.some(l => touched.has(l.id))
    if (anyTouched && done < ls.length) {
      const next = ls.find(l => !completed.has(l.id))
      const slug = c.slug ?? (c.pillar_number ? PILLAR_SLUG[c.pillar_number] : 'foundation')
      const name =
        c.pillar_number && PILLAR_CONFIG[c.pillar_number as 1 | 2 | 3 | 4 | 5 | 6]
          ? PILLAR_CONFIG[c.pillar_number as 1 | 2 | 3 | 4 | 5 | 6].label
          : c.title
      return {
        href: next?.slug ? `/academy/${slug}/${next.slug}` : `/academy/${slug}`,
        label: `Continue ${name}`,
        pillarSlug: slug,
      }
    }
  }

  return {
    href: '/academy/foundation',
    label: 'Start Foundation',
    pillarSlug: 'foundation' as string | null,
  }
}

export default async function ScoreboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await resolveCurrentUser(supabase)
  if (!profile) redirect('/login')

  const weekStart = getCurrentMonday()

  const [dailyHabits, weekCommitments, goalsResult, course] = await Promise.all([
    fetchTodaysHabits(user.id),
    fetchWeekCommitments(profile.id, weekStart),
    adminClient
      .from('quarterly_goals')
      .select('id, title, period, progress_pct, weekly_delta, pillar')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(10),
    fetchInProgressCourse(profile.id),
  ])

  const goals: GoalForCard[] = (goalsResult.data ?? []).map(g => ({
    id: g.id,
    title: g.title,
    period: g.period,
    progress_pct: g.progress_pct ?? 0,
    weekly_delta: g.weekly_delta ?? 0,
    pillar: g.pillar,
  }))

  return (
    <div className="px-6 pb-10 space-y-6" style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* Breadcrumb / context */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          paddingTop: 8,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--brand-red, #C9302A)',
            }}
          >
            Member scoreboard
          </p>
          <h1
            style={{
              margin: '4px 0 0',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 40,
              letterSpacing: '0.04em',
              lineHeight: 1,
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
            }}
          >
            Goals & Accountability
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              fontFamily: '"Barlow", sans-serif',
              fontSize: 14,
              color: 'var(--text-secondary)',
              maxWidth: 520,
              lineHeight: 1.45,
            }}
          >
            Your central daily habit driver — log habits, check commitments, update
            quarterly goals, and jump straight into the next lesson.
          </p>
        </div>
        <Link
          href="/home"
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          ← Home
        </Link>
      </div>

      <AccountabilityHub
        variant="full"
        habits={dailyHabits}
        commitments={weekCommitments}
        goals={goals}
        courseHref={course.href}
        courseLabel={course.label}
        weekLabel={formatWeekLabel(weekStart)}
      />

      {/* Expanded goal cards with path-forward ties */}
      {goals.length > 0 && (
        <section aria-label="Goal detail cards">
          <div
            className="flex items-center gap-4"
            style={{ margin: '8px 0 12px' }}
          >
            <span style={{ width: 28, height: 1, background: 'rgba(201,168,76,0.5)' }} />
            <span
              className="font-condensed font-bold uppercase"
              style={{
                fontSize: 10,
                letterSpacing: '0.42em',
                color: 'rgba(201,168,76,0.85)',
              }}
            >
              Goal detail
            </span>
            <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {goals.map(g => (
              <GoalCard
                key={g.id}
                goal={g}
                inProgressPillarSlug={course.pillarSlug}
                inProgressContinueHref={course.href}
              />
            ))}
          </div>
        </section>
      )}

      {/* Weekly commitment writer */}
      <section aria-label="Weekly commitments">
        <div
          className="flex items-center gap-4"
          style={{ margin: '8px 0 12px' }}
        >
          <span style={{ width: 28, height: 1, background: 'rgba(201,168,76,0.5)' }} />
          <span
            className="font-condensed font-bold uppercase"
            style={{
              fontSize: 10,
              letterSpacing: '0.42em',
              color: 'rgba(201,168,76,0.85)',
            }}
          >
            Set this week
          </span>
          <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <CommitmentTracker weekStart={weekStart} />
      </section>

      {/* Academy deep link */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          padding: '16px 18px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
        }}
      >
        <Link
          href="/academy/accountability"
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#C9A84C',
            textDecoration: 'none',
          }}
        >
          Pillar 5 · Accountability course →
        </Link>
        <Link
          href="/academy"
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          All pillars →
        </Link>
        <Link
          href="/leaderboard"
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          Community leaderboard →
        </Link>
      </div>
    </div>
  )
}
