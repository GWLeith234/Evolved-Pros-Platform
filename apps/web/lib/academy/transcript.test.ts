import { describe, expect, it } from 'vitest'
import { asTranscriptSegments, parseTranscriptJson } from './transcript'

const SEGMENTS = [
  { timestamp: '0:00', seconds: 0, text: 'Welcome to the lesson.' },
  { timestamp: '0:52', seconds: 52, text: 'The scoreboard is not optional.' },
  { timestamp: '1:22', seconds: 82, text: 'Track what matters.' },
]

describe('asTranscriptSegments', () => {
  it('accepts a valid segments array', () => {
    expect(asTranscriptSegments(SEGMENTS)).toEqual(SEGMENTS)
  })

  it('accepts H:MM:SS timestamps', () => {
    const long = [{ timestamp: '1:02:15', seconds: 3735, text: 'Deep in.' }]
    expect(asTranscriptSegments(long)).toEqual(long)
  })

  it('rejects null, empty arrays, and non-arrays', () => {
    expect(asTranscriptSegments(null)).toBeNull()
    expect(asTranscriptSegments([])).toBeNull()
    expect(asTranscriptSegments('0:00 hello')).toBeNull()
    expect(asTranscriptSegments({ segments: SEGMENTS })).toBeNull()
  })

  it('rejects malformed segments', () => {
    expect(asTranscriptSegments([{ timestamp: 'nope', seconds: 0, text: 'x' }])).toBeNull()
    expect(asTranscriptSegments([{ timestamp: '0:00', seconds: -1, text: 'x' }])).toBeNull()
    expect(asTranscriptSegments([{ timestamp: '0:00', seconds: 0, text: '  ' }])).toBeNull()
    expect(asTranscriptSegments([{ timestamp: '0:00', seconds: '0', text: 'x' }])).toBeNull()
  })

  it('floors fractional seconds', () => {
    const out = asTranscriptSegments([{ timestamp: '0:05', seconds: 5.9, text: 'x' }])
    expect(out?.[0].seconds).toBe(5)
  })
})

describe('parseTranscriptJson', () => {
  it('parses a bare segments array', () => {
    const res = parseTranscriptJson(JSON.stringify(SEGMENTS))
    expect(res).toEqual({ ok: true, segments: SEGMENTS })
  })

  it('parses the extractor file shape ({ lessonSlug, segments })', () => {
    const res = parseTranscriptJson(
      JSON.stringify({ lessonSlug: 'accountability-the-scoreboard', segments: SEGMENTS }),
    )
    expect(res).toEqual({ ok: true, segments: SEGMENTS })
  })

  it('treats empty input as clearing the transcript', () => {
    expect(parseTranscriptJson('')).toEqual({ ok: true, segments: null })
    expect(parseTranscriptJson('   \n')).toEqual({ ok: true, segments: null })
  })

  it('rejects invalid JSON with a readable error', () => {
    const res = parseTranscriptJson('{not json')
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toMatch(/valid JSON/i)
  })

  it('rejects out-of-order timestamps', () => {
    const res = parseTranscriptJson(JSON.stringify([
      { timestamp: '1:00', seconds: 60, text: 'later' },
      { timestamp: '0:30', seconds: 30, text: 'earlier' },
    ]))
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toMatch(/out of order/i)
  })

  it('rejects wrong shapes with guidance', () => {
    const res = parseTranscriptJson('{"foo": 1}')
    expect(res.ok).toBe(false)
  })
})
