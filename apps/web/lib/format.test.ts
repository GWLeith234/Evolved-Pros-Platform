import { describe, it, expect } from 'vitest'
import {
  formatRelative,
  formatDate,
  formatCount,
  formatPct,
  formatEpisode,
  formatDuration,
  formatTrend,
} from './format'

// A fixed "now" so the relative-time ladder is deterministic regardless of
// when/where the suite runs. All offsets are computed back from this.
const NOW = new Date('2026-06-29T12:00:00Z')
const ago = (ms: number) => new Date(NOW.getTime() - ms)
const SEC = 1000
const MIN = 60 * SEC
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const WEEK = 7 * DAY

describe('formatRelative', () => {
  it('renders the unit ladder', () => {
    expect(formatRelative(ago(30 * SEC), { now: NOW })).toBe('now')
    expect(formatRelative(ago(5 * MIN), { now: NOW })).toBe('5m')
    expect(formatRelative(ago(3 * HOUR), { now: NOW })).toBe('3h')
    expect(formatRelative(ago(4 * DAY), { now: NOW })).toBe('4d')
    expect(formatRelative(ago(6 * WEEK), { now: NOW })).toBe('6w')
  })

  it('treats 42 days as 6w (weeks, not days) — the cross-surface invariant', () => {
    expect(formatRelative(ago(42 * DAY), { now: NOW })).toBe('6w')
  })

  it('falls back to an absolute "MMM D" beyond 8 weeks and never suffixes it', () => {
    const old = new Date('2026-01-10T12:00:00Z')
    expect(formatRelative(old, { now: NOW })).toBe('Jan 10')
    expect(formatRelative(old, { now: NOW, withAgo: true })).toBe('Jan 10')
  })

  it('appends " ago" only to relative units, keeping the unit unchanged', () => {
    expect(formatRelative(ago(42 * DAY), { now: NOW, withAgo: true })).toBe('6w ago')
    expect(formatRelative(ago(30 * SEC), { now: NOW, withAgo: true })).toBe('now')
  })

  it('returns "" for an invalid date', () => {
    expect(formatRelative('not-a-date', { now: NOW })).toBe('')
  })
})

describe('formatDate', () => {
  // Use local-time Date constructors so day/month are timezone-stable.
  const jul15 = new Date(2026, 6, 15)
  const jun18 = new Date(2026, 5, 18)

  it('stamp → uppercase month + day', () => {
    expect(formatDate(jul15, 'stamp')).toBe('JUL 15')
  })

  it('inline → title-case month + day', () => {
    expect(formatDate(jun18, 'inline')).toBe('Jun 18')
  })

  it('deadline → quarter granularity (one project-wide style)', () => {
    expect(formatDate(jul15, 'deadline')).toBe('Q3 2026')
    expect(formatDate(jun18, 'deadline')).toBe('Q2 2026')
  })

  it('deadline normalizes stored period strings', () => {
    expect(formatDate('Q2-2026', 'deadline')).toBe('Q2 2026')
    expect(formatDate('2026-Q2', 'deadline')).toBe('Q2 2026')
  })

  it('returns "" for unparseable date input', () => {
    expect(formatDate('nonsense', 'stamp')).toBe('')
  })
})

describe('formatCount', () => {
  it('renders done/total with a lowercased noun', () => {
    expect(formatCount(2, 3, 'lessons')).toBe('2/3 lessons')
    expect(formatCount(0, 5, 'Habits')).toBe('0/5 habits')
  })
})

describe('formatPct', () => {
  it('renders an integer percent with no space', () => {
    expect(formatPct(0.67)).toBe('67%')
    expect(formatPct(0)).toBe('0%')
    expect(formatPct(1)).toBe('100%')
  })
  it('rounds', () => {
    expect(formatPct(0.666)).toBe('67%')
  })
})

describe('formatEpisode', () => {
  it('zero-pads to two digits', () => {
    expect(formatEpisode(6)).toBe('#06')
    expect(formatEpisode(12)).toBe('#12')
  })
  it('returns "" for null/undefined', () => {
    expect(formatEpisode(null)).toBe('')
    expect(formatEpisode(undefined)).toBe('')
  })
})

describe('formatDuration', () => {
  it('renders "N min" for positive values', () => {
    expect(formatDuration(2)).toBe('2 min')
    expect(formatDuration(2.4)).toBe('2 min') // rounds
  })
  it('returns null for null/0/negative so the slot can be hidden', () => {
    expect(formatDuration(0)).toBeNull()
    expect(formatDuration(null)).toBeNull()
    expect(formatDuration(-5)).toBeNull()
  })
})

describe('formatTrend', () => {
  it('up → arrow + signed percent + period', () => {
    expect(formatTrend(0.12)).toBe('↑ +12% wk')
  })
  it('down → uses a real minus sign (U+2212), not a hyphen', () => {
    expect(formatTrend(-0.03)).toBe('↓ −3% wk')
    expect(formatTrend(-0.03)).toContain('−')
  })
  it('flat → em dash, still shows 0% and the period', () => {
    expect(formatTrend(0)).toBe('— 0% wk')
  })
  it('honors a custom period', () => {
    expect(formatTrend(0.1, 'mo')).toBe('↑ +10% mo')
  })
})
