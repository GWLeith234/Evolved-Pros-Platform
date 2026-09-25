/** UTC week windows for /media/preview?week=YYYY-MM-DD. The date is day one of seven. */

const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/

export function firstSearchParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return null
}

export function parseWeekStart(raw: string): string | null {
  if (!WEEK_RE.test(raw)) return null
  const [year, month, day] = raw.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null
  }
  return raw
}

/** Monday (UTC) of the week that contains `now`. */
export function currentUtcWeekStart(now: Date = new Date()): string {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = date.getUTCDay()
  const delta = day === 0 ? 6 : day - 1
  date.setUTCDate(date.getUTCDate() - delta)
  return date.toISOString().slice(0, 10)
}

export function weekWindow(weekStart: string): { startMs: number; endMs: number } {
  const parsed = parseWeekStart(weekStart)
  if (!parsed) throw new Error('Invalid week')
  const [year, month, day] = parsed.split('-').map(Number)
  const startMs = Date.UTC(year, month - 1, day)
  return { startMs, endMs: startMs + 7 * 24 * 60 * 60 * 1000 }
}

export function shiftWeek(weekStart: string, days: number): string {
  const { startMs } = weekWindow(weekStart)
  return new Date(startMs + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function formatWeekLabel(weekStart: string): string {
  const { startMs, endMs } = weekWindow(weekStart)
  const fmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return `${fmt.format(new Date(startMs))} to ${fmt.format(new Date(endMs - 1))}`
}

export function storyTimestamp(story: {
  updated_at?: string | null
  created_at?: string | null
  published_at?: string | null
}): number | null {
  const raw = story.updated_at || story.created_at || story.published_at
  if (!raw) return null
  const time = Date.parse(raw)
  return Number.isFinite(time) ? time : null
}

export function storyFallsInWeek(
  story: {
    updated_at?: string | null
    created_at?: string | null
    published_at?: string | null
  },
  weekStart: string,
): boolean {
  const time = storyTimestamp(story)
  if (time === null) return false
  const { startMs, endMs } = weekWindow(weekStart)
  return time >= startMs && time < endMs
}

export function unpublishedStories<T extends { is_published?: boolean | null }>(rows: T[]): T[] {
  return rows.filter(row => row.is_published !== true)
}
