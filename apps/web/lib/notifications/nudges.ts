import 'server-only'
import { adminClient } from '@/lib/supabase/admin'
import { notifyDailyProgress, notifyWigNudge } from '@/lib/notifications/create'
import {
  DAILY_DEDUPE_MS,
  WIG_DEDUPE_MS,
  dailyActionUrl,
  dailyCopy,
  decideDailyNudge,
  decideWigNudge,
  isEveningUtc,
  isoMondayYmd,
  utcDateYmd,
  wigActionUrl,
  wigCopy,
} from '@/lib/notifications/intents'

type GoalRow = {
  user_id: string
  title: string
  updated_at: string | null
}

function mondayYmd(now: Date = new Date()): string {
  const day = now.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff))
  return monday.toISOString().slice(0, 10)
}

export async function listActiveMemberIds(): Promise<string[]> {
  const { data, error } = await adminClient
    .from('users')
    .select('id')
    .in('tier_status', ['active', 'trial'])
    .neq('role', 'admin')

  if (error) {
    console.error('[notifications/nudges] list members', error)
    return []
  }
  return (data ?? []).map(u => u.id)
}

async function loadGoalForUser(userId: string): Promise<GoalRow | null> {
  const today = utcDateYmd()
  const { data, error } = await adminClient
    .from('quarterly_goals')
    .select('user_id, title, updated_at, is_active, target_date')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('[notifications/nudges] load goal', error)
    return null
  }
  const live = (data ?? []).filter(row => {
    const target = (row as { target_date?: string | null }).target_date
    return !target || target >= today
  })
  return live[0]
    ? { user_id: live[0].user_id, title: live[0].title, updated_at: live[0].updated_at }
    : null
}

async function loadActiveGoalsByUser(): Promise<Map<string, GoalRow>> {
  const today = utcDateYmd()
  const { data, error } = await adminClient
    .from('quarterly_goals')
    .select('user_id, title, updated_at, is_active, target_date')
    .eq('is_active', true)

  if (error) {
    console.error('[notifications/nudges] load goals', error)
    return new Map()
  }

  const byUser = new Map<string, GoalRow>()
  for (const row of data ?? []) {
    const target = (row as { target_date?: string | null }).target_date
    if (target && target < today) continue
    const existing = byUser.get(row.user_id)
    if (!existing || (row.updated_at ?? '') > (existing.updated_at ?? '')) {
      byUser.set(row.user_id, {
        user_id: row.user_id,
        title: row.title,
        updated_at: row.updated_at,
      })
    }
  }
  return byUser
}

export async function maybeNudgeWigForUser(
  userId: string,
  goal?: GoalRow | null,
  now: Date = new Date(),
): Promise<boolean> {
  const decision = decideWigNudge({
    hasActiveGoal: Boolean(goal),
    goalTitle: goal?.title,
    updatedAt: goal?.updated_at,
    now,
  })
  if (!decision) return false

  const copy = wigCopy(decision.kind, { title: decision.kind === 'update' ? decision.title : goal?.title })
  return notifyWigNudge({
    userId,
    title: copy.title,
    body: copy.body,
    actionUrl: wigActionUrl(decision.kind),
    sinceMs: WIG_DEDUPE_MS,
  })
}

export async function enqueueWigNudges(now: Date = new Date()): Promise<{ complete: number; update: number }> {
  const [memberIds, goalsByUser] = await Promise.all([
    listActiveMemberIds(),
    loadActiveGoalsByUser(),
  ])

  let complete = 0
  let update = 0
  for (const userId of memberIds) {
    const goal = goalsByUser.get(userId) ?? null
    const decision = decideWigNudge({
      hasActiveGoal: Boolean(goal),
      goalTitle: goal?.title,
      updatedAt: goal?.updated_at,
      now,
    })
    if (!decision) continue
    const wrote = await maybeNudgeWigForUser(userId, goal, now)
    if (!wrote) continue
    if (decision.kind === 'complete') complete++
    else update++
  }
  return { complete, update }
}

export async function enqueueWeeklyWigNudges(now: Date = new Date()): Promise<number> {
  const goalsByUser = await loadActiveGoalsByUser()
  const weekStart = isoMondayYmd(now)
  const copy = wigCopy('weekly')
  let sent = 0
  for (const [userId, goal] of goalsByUser) {
    const wrote = await notifyWigNudge({
      userId,
      title: copy.title,
      body: wigCopy('weekly', { title: goal.title }).body,
      actionUrl: wigActionUrl('weekly', { weekStart }),
      sinceMs: WIG_DEDUPE_MS,
    })
    if (wrote) sent++
  }
  return sent
}

async function dailyProgressForUser(userId: string, now: Date): Promise<{ incomplete: number } | null> {
  const today = utcDateYmd(now)
  const weekStart = mondayYmd(now)

  const [habitsRes, completionsRes, commitsRes] = await Promise.all([
    adminClient
      .from('habits')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true),
    adminClient
      .from('habit_completions')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('completed_date', today)
      .not('habit_id', 'is', null),
    adminClient
      .from('weekly_commitments')
      .select('id, is_completed')
      .eq('user_id', userId)
      .eq('week_start', weekStart),
  ])

  const habitIds = new Set((habitsRes.data ?? []).map(h => h.id))
  const doneHabitIds = new Set(
    (completionsRes.data ?? []).map(c => c.habit_id).filter((id): id is string => typeof id === 'string' && habitIds.has(id)),
  )
  const commits = commitsRes.data ?? []

  return decideDailyNudge({
    habitsTotal: habitIds.size,
    habitsDone: doneHabitIds.size,
    commitsTotal: commits.length,
    commitsDone: commits.filter(c => c.is_completed).length,
    hourUtc: now.getUTCHours(),
  })
}

export async function maybeNudgeDailyForUser(userId: string, now: Date = new Date()): Promise<boolean> {
  const decision = await dailyProgressForUser(userId, now)
  if (!decision) return false
  const copy = dailyCopy(decision.incomplete)
  return notifyDailyProgress({
    userId,
    title: copy.title,
    body: copy.body,
    actionUrl: dailyActionUrl(utcDateYmd(now)),
    sinceMs: DAILY_DEDUPE_MS,
  })
}

export async function enqueueDailyProgressNudges(now: Date = new Date()): Promise<number> {
  if (!isEveningUtc(now)) return 0

  const memberIds = await listActiveMemberIds()
  let sent = 0
  for (const userId of memberIds) {
    if (await maybeNudgeDailyForUser(userId, now)) sent++
  }
  return sent
}

/** On-open Home path — one member, WIG + evening daily, fire-and-forget. */
export async function enqueueSessionNudges(userId: string, now: Date = new Date()): Promise<void> {
  try {
    const goal = await loadGoalForUser(userId)
    await Promise.all([
      maybeNudgeWigForUser(userId, goal, now),
      maybeNudgeDailyForUser(userId, now),
    ])
  } catch (err) {
    console.error('[notifications/nudges] session', err)
  }
}
