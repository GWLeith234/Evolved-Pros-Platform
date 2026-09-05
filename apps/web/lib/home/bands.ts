/**
 * Locked Home IA helpers (George 2026-09-04).
 * Banner (WIG) -> Accountability (leading measures) -> Fuel (offerings).
 * Pure functions only: no hex, no em dashes in user-facing strings.
 */

import { allowedEpisodeStillUrl, type EpisodeStillSource } from '@/lib/podcast/stillUrl'
import { formatDuration } from '@/lib/format'

export const HOME_PILLAR_CHIPS = [
  { n: 1 as const, chip: 'Found.', name: 'Foundation' },
  { n: 2 as const, chip: 'Identity', name: 'Identity' },
  { n: 3 as const, chip: 'Mental', name: 'Mental Toughness' },
  { n: 4 as const, chip: 'Strategy', name: 'Strategy' },
  { n: 5 as const, chip: 'Acct.', name: 'Accountability' },
  { n: 6 as const, chip: 'Exec.', name: 'Execution' },
] as const

export type HomePillarState = 'earned' | 'in-progress' | 'locked'

export function computeCheckInStreak(
  completedDates: Iterable<string>,
  today: string,
): { days: number; checkedInToday: boolean } {
  const days = new Set(
    [...completedDates]
      .map(d => d.slice(0, 10))
      .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)),
  )
  const checkedInToday = days.has(today)

  let cursor = checkedInToday ? today : shiftIsoDate(today, -1)
  if (!days.has(cursor)) return { days: 0, checkedInToday }

  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    cursor = shiftIsoDate(cursor, -1)
  }
  return { days: streak, checkedInToday }
}

export function shiftIsoDate(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + deltaDays)
  return dt.toISOString().slice(0, 10)
}

export function formatLagDelta(weeklyDelta: number): {
  text: string
  direction: 'up' | 'down' | 'flat'
} {
  const pct = Math.round(weeklyDelta)
  if (pct === 0) return { text: '0% wk', direction: 'flat' }
  if (pct > 0) return { text: `+${pct}% wk`, direction: 'up' }
  return { text: `${pct}% wk`, direction: 'down' }
}

/** Compact period chip: "Q2-2026" / "2026-Q2" -> "Q2". */
export function formatQuarterChip(period: string): string {
  const m = period.match(/Q(\d)/i)
  if (!m) return period.trim().slice(0, 6) || 'Q'
  return `Q${m[1]}`
}

export function weeklyCommitPulse(done: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)))
}

export function leadingMeasureStatus(completed: boolean, target = 1): {
  label: 'DONE' | 'NOT YET'
  fraction: string
} {
  const safeTarget = Math.max(1, Math.round(target))
  const done = completed ? safeTarget : 0
  return {
    label: completed ? 'DONE' : 'NOT YET',
    fraction: `${done}/${safeTarget}`,
  }
}

export function winChipLabel(body: string, max = 22): string {
  const cleaned = body.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'Win logged'
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, Math.max(1, max - 1)).trimEnd()}…`
}

export function remainingLessonLabel(
  durationSeconds: number | null | undefined,
  remainingLessons: number,
): string | null {
  if (durationSeconds && durationSeconds > 0) {
    return formatDuration(Math.round(durationSeconds / 60))
      ? `${formatDuration(Math.round(durationSeconds / 60))} left`
      : null
  }
  if (remainingLessons > 0) {
    const noun = remainingLessons === 1 ? 'lesson' : 'lessons'
    return `${remainingLessons} ${noun} left`
  }
  return null
}

/** Default live window when an event has no ends_at. */
export const LIVE_FALLBACK_MS = 60 * 60 * 1000

export function isEventHappeningNow(
  startsAt: string,
  endsAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  const start = new Date(startsAt).getTime()
  if (!Number.isFinite(start)) return false
  const parsedEnd = endsAt ? new Date(endsAt).getTime() : NaN
  const end = Number.isFinite(parsedEnd) ? parsedEnd : start + LIVE_FALLBACK_MS
  const t = now.getTime()
  return t >= start && t <= end
}

export function pickFuelLiveEvent<T extends { starts_at: string; ends_at: string | null }>(
  started: readonly T[],
  upcoming: T | null,
  now: Date = new Date(),
): T | null {
  return started.find(e => isEventHappeningNow(e.starts_at, e.ends_at, now)) ?? upcoming
}

export function isVisibleWin(row: {
  kind?: string | null
  post_type?: string | null
  status?: string | null
}): boolean {
  if (row.status === 'rejected') return false
  return row.kind === 'win' || row.post_type === 'win'
}

/** Guest still first. Juan EP010 stays on the public guest path. */
export function homeEpisodeStill(ep: EpisodeStillSource): string | null {
  return allowedEpisodeStillUrl(ep)
}

export function assertNoEmDash(copy: string): boolean {
  return !copy.includes('\u2014') && !copy.includes('\u2013')
}
