// Shared formatter module — Sprint 2 (data formatting).
//
// The single source of truth for rendering dates, relative times, counts,
// percentages, episode numbers, durations, and trend deltas across the home
// surfaces. The same datum must render identically everywhere, so NOTHING in a
// component should format these inline (`+ 'd ago'`, `padStart`, `+ '%'`,
// `toLocaleDateString`, …) — call through here instead.
//
// All functions are pure. Date inputs accept a Date, an ISO string, or epoch
// millis so callers can pass whatever the data layer hands them.

// ── shared internals ────────────────────────────────────────────────────────

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

/** Coerce a Date | ISO string | epoch millis into a Date (or null if invalid). */
function toDate(input: Date | string | number): Date | null {
  const d = input instanceof Date ? input : new Date(input)
  return Number.isNaN(d.getTime()) ? null : d
}

// ── relative time ───────────────────────────────────────────────────────────

export interface FormatRelativeOptions {
  /**
   * Append " ago" for wider surfaces (e.g. the activity feed). The *unit* is
   * unchanged — `6w` stays `6w`, it just becomes `6w ago`. The "now" and
   * absolute `MMM D` forms never take the suffix.
   */
  withAgo?: boolean
  /** Override "now" — primarily for tests. Defaults to the current time. */
  now?: Date | string | number
}

/**
 * One relative-time ladder, used on every surface:
 *   <1m  → "now"
 *   <1h  → "Nm"
 *   <24h → "Nh"
 *   <7d  → "Nd"
 *   <8w  → "Nw"
 *   else → "MMM D"   (e.g. "Mar 3")
 *
 * 42 days is `6w` everywhere; the only per-surface choice is whether to append
 * " ago" (see `withAgo`). Returns "" for an invalid date.
 */
export function formatRelative(
  date: Date | string | number,
  options: FormatRelativeOptions = {},
): string {
  const then = toDate(date)
  if (!then) return ''
  const now = (options.now != null ? toDate(options.now) : new Date()) ?? new Date()

  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  const ago = (s: string) => (options.withAgo ? `${s} ago` : s)

  if (seconds < 60) return 'now'
  if (seconds < 3600) return ago(`${Math.floor(seconds / 60)}m`)
  if (seconds < 86400) return ago(`${Math.floor(seconds / 3600)}h`)
  if (seconds < 604800) return ago(`${Math.floor(seconds / 86400)}d`)
  if (seconds < 4838400) return ago(`${Math.floor(seconds / 604800)}w`) // < 8 weeks
  return `${MONTHS[then.getMonth()]} ${then.getDate()}` // absolute, never suffixed
}

// ── dates ───────────────────────────────────────────────────────────────────

export type DateStyle = 'stamp' | 'inline' | 'deadline'

/**
 * Project-wide deadline granularity. Quarter-scoped: every goal/long-game tag
 * renders as `Q2 2026`. This is the single switch — flip to 'month' to render
 * all deadline tags as `MMM` instead. Do NOT mix granularities per the brief.
 */
const DEADLINE_GRANULARITY: 'quarter' | 'month' = 'quarter'

function quarterOf(d: Date): number {
  return Math.floor(d.getMonth() / 3) + 1
}

/**
 * Format a date into one of exactly three canonical styles:
 *   "stamp"    → "JUL 15"   (calendar chips; uppercase month)
 *   "inline"   → "Jun 18"   (within meta / sentences)
 *   "deadline" → "Q2 2026"  (goal tags; one granularity project-wide)
 *
 * `deadline` also accepts the stored goal `period` strings ("Q2-2026",
 * "2026-Q2") and normalizes them to the canonical form, so callers can pass
 * either a Date or the raw period string. Returns "" for unparseable input.
 */
export function formatDate(date: Date | string | number, style: DateStyle): string {
  if (style === 'deadline') return formatDeadline(date)

  const d = toDate(date)
  if (!d) return ''
  const month = MONTHS[d.getMonth()]
  if (style === 'stamp') return `${month.toUpperCase()} ${d.getDate()}`
  return `${month} ${d.getDate()}` // inline
}

function formatDeadline(date: Date | string | number): string {
  // Accept the stored period strings ("Q2-2026" / "2026-Q2" / "Q2/2026").
  if (typeof date === 'string') {
    const m =
      date.match(/Q(\d)[-/\s](\d{4})/i) ?? date.match(/(\d{4})[-/\s]Q(\d)/i)
    if (m) {
      const q = parseInt(m[1].length === 4 ? m[2] : m[1], 10)
      const yyyy = parseInt(m[1].length === 4 ? m[1] : m[2], 10)
      if (q >= 1 && q <= 4) {
        return DEADLINE_GRANULARITY === 'quarter'
          ? `Q${q} ${yyyy}`
          : MONTHS[(q - 1) * 3].toUpperCase()
      }
    }
  }

  const d = toDate(date)
  if (!d) return typeof date === 'string' ? date : '' // pass through unknown label
  return DEADLINE_GRANULARITY === 'quarter'
    ? `Q${quarterOf(d)} ${d.getFullYear()}`
    : MONTHS[d.getMonth()].toUpperCase()
}

// ── counts & percentages ────────────────────────────────────────────────────

/**
 * "2/3 lessons" — done/total order, lowercase noun. The noun is rendered as
 * given (lowercased) so callers pass `'lessons'`, `'habits'`, `'done'`, etc.
 */
export function formatCount(done: number, total: number, noun: string): string {
  return `${done}/${total} ${noun.toLowerCase()}`
}

/** "67%" — integer percent, no space. `ratio` is 0..1. */
export function formatPct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

// ── episode numbers ─────────────────────────────────────────────────────────

/** "#06" — zero-padded to two digits. Returns "" for null/undefined. */
export function formatEpisode(n: number | null | undefined): string {
  if (n == null) return ''
  return `#${String(n).padStart(2, '0')}`
}

// ── durations / read time ───────────────────────────────────────────────────

/**
 * "2 min" — lowercase. Returns null for null/0/negative so callers can hide
 * the slot entirely rather than rendering a bare "—".
 */
export function formatDuration(mins: number | null | undefined): string | null {
  if (mins == null || mins <= 0) return null
  return `${Math.round(mins)} min`
}

// ── trend (consumed by Sprint 4) ────────────────────────────────────────────

/**
 * "↑ +12% wk" / "↓ −3% wk" / "— 0% wk".
 *   - em dash (—) for flat
 *   - a real minus sign (−, U+2212) for negatives, not a hyphen
 *   - `deltaRatio` is 0..1 (0.12 → 12%)
 */
export function formatTrend(deltaRatio: number, period = 'wk'): string {
  const pct = Math.round(deltaRatio * 100)
  if (pct === 0) return `— 0% ${period}`
  if (pct > 0) return `↑ +${pct}% ${period}`
  return `↓ −${Math.abs(pct)}% ${period}` // U+2212 minus sign
}

// ── inline sanity checks (dev only) ─────────────────────────────────────────
// Cheap assertions that run once on import in development. Kept out of prod
// bundles by the NODE_ENV guard; they document expected output and guard the
// ladder/format invariants without a test runner.
if (process.env.NODE_ENV === 'development') {
  const SECOND = 1000
  const at = (ms: number) => new Date(Date.now() - ms)
  const eq = (got: unknown, want: unknown, label: string) => {
    if (got !== want) {
      // eslint-disable-next-line no-console
      console.warn(`[format] sanity check failed: ${label} — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)
    }
  }
  eq(formatRelative(at(30 * SECOND)), 'now', 'relative <1m')
  eq(formatRelative(at(5 * 60 * SECOND)), '5m', 'relative 5m')
  eq(formatRelative(at(3 * 3600 * SECOND)), '3h', 'relative 3h')
  eq(formatRelative(at(4 * 86400 * SECOND)), '4d', 'relative 4d')
  eq(formatRelative(at(42 * 86400 * SECOND)), '6w', 'relative 42d=6w')
  eq(formatRelative(at(42 * 86400 * SECOND), { withAgo: true }), '6w ago', 'relative withAgo')
  eq(formatDate('2026-07-15T00:00:00Z', 'stamp').startsWith('JUL'), true, 'stamp uppercase')
  eq(formatDate('Q2-2026', 'deadline'), 'Q2 2026', 'deadline from period string')
  eq(formatCount(2, 3, 'Lessons'), '2/3 lessons', 'count lowercases noun')
  eq(formatPct(0.67), '67%', 'pct integer')
  eq(formatEpisode(6), '#06', 'episode zero-pad')
  eq(formatDuration(0), null, 'duration 0 → null')
  eq(formatDuration(2), '2 min', 'duration 2 min')
  eq(formatTrend(0.12), '↑ +12% wk', 'trend up')
  eq(formatTrend(-0.03), '↓ −3% wk', 'trend down minus sign')
  eq(formatTrend(0), '— 0% wk', 'trend flat em dash')
}
