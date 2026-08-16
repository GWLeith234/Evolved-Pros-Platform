import { describe, expect, it } from 'vitest'
import {
  filterUpcoming,
  isPastSpeakingDate,
  normalizeIsoDate,
  parseIsoDate,
  sanitizeSpeakingLinkUrl,
  validateStoredRow,
} from './upcoming-dates-shared'

describe('normalizeIsoDate / parseIsoDate', () => {
  it('accepts valid YYYY-MM-DD and rejects invalid calendars', () => {
    expect(normalizeIsoDate('2026-08-16')).toBe('2026-08-16')
    expect(normalizeIsoDate('2026-02-31')).toBeNull()
    expect(normalizeIsoDate('08/16/2026')).toBeNull()
    expect(normalizeIsoDate('not-a-date')).toBeNull()
  })

  it('parses as UTC noon', () => {
    const d = parseIsoDate('2026-08-16')
    expect(d?.toISOString()).toBe('2026-08-16T12:00:00.000Z')
  })
})

describe('sanitizeSpeakingLinkUrl', () => {
  it('allows http(s) and same-origin paths', () => {
    expect(sanitizeSpeakingLinkUrl('https://example.com/x')).toBe('https://example.com/x')
    expect(sanitizeSpeakingLinkUrl('/events/1')).toBe('/events/1')
  })

  it('rejects dangerous schemes and protocol-relative URLs', () => {
    expect(sanitizeSpeakingLinkUrl('javascript:alert(1)')).toBeUndefined()
    expect(sanitizeSpeakingLinkUrl('data:text/html,hi')).toBeUndefined()
    expect(sanitizeSpeakingLinkUrl('//evil.com')).toBeUndefined()
  })
})

describe('validateStoredRow', () => {
  it('normalizes date and strips bad links', () => {
    const bad = validateStoredRow({
      event: 'Keynote',
      city: 'Austin',
      date: '2026-08-16',
      linkUrl: 'javascript:alert(1)',
    })
    expect(bad.ok).toBe(false)

    const ok = validateStoredRow({
      event: 'Keynote',
      city: 'Austin',
      date: '2026-08-16',
      linkUrl: 'https://example.com',
    })
    expect(ok.ok).toBe(true)
    if (ok.ok) expect(ok.value.date).toBe('2026-08-16')
  })
})

describe('filterUpcoming / isPastSpeakingDate', () => {
  it('keeps today and future by calendar string', () => {
    const rows = [
      { id: '1', date: '2026-08-15', city: 'A', country: 'US', event: 'Past', tag: 'CONFIRMED' as const },
      { id: '2', date: '2026-08-16', city: 'B', country: 'US', event: 'Today', tag: 'CONFIRMED' as const },
      { id: '3', date: '2026-08-17', city: 'C', country: 'US', event: 'Future', tag: 'HOLD' as const },
    ]
    const upcoming = filterUpcoming(rows, '2026-08-16')
    expect(upcoming.map(d => d.event)).toEqual(['Today', 'Future'])
    expect(isPastSpeakingDate('2026-08-15', '2026-08-16')).toBe(true)
    expect(isPastSpeakingDate('2026-08-16', '2026-08-16')).toBe(false)
  })
})
