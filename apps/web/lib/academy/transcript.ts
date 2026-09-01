/**
 * Shared shape + validation for lesson transcripts (lessons.transcript jsonb).
 *
 * Canonical storage format — an array of timestamped segments produced by
 * scripts/heygen-extract-transcripts.ts:
 *   [{ "timestamp": "0:52", "seconds": 52, "text": "..." }, ...]
 *
 * Used by the admin lesson form (paste + preview), the admin PATCH route
 * (server-side validation), and the member lesson page (render + seek).
 */

// Type alias (not interface) on purpose: aliases get an implicit index
// signature, so TranscriptSegment[] is assignable to Supabase's Json type.
export type TranscriptSegment = {
  /** Display timestamp as extracted, e.g. "0:00", "1:22", "1:02:15". */
  timestamp: string
  /** Same moment as integer seconds — what the player seeks to. */
  seconds: number
  text: string
}

const TS_RE = /^\d{1,2}:\d{2}(?::\d{2})?$/

/** Runtime-validate an unknown value (e.g. the jsonb column) as segments. */
export function asTranscriptSegments(value: unknown): TranscriptSegment[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const out: TranscriptSegment[] = []
  for (const item of value) {
    const seg = item as Record<string, unknown>
    if (
      typeof seg?.timestamp !== 'string' || !TS_RE.test(seg.timestamp) ||
      typeof seg?.seconds !== 'number' || seg.seconds < 0 ||
      typeof seg?.text !== 'string' || !seg.text.trim()
    ) {
      return null
    }
    out.push({ timestamp: seg.timestamp, seconds: Math.floor(seg.seconds), text: seg.text })
  }
  return out
}

/**
 * Parse admin-pasted JSON. Accepts either the extractor's file shape
 * ({ lessonSlug, segments: [...] }) or a bare segments array. Empty input
 * means "clear the transcript" (null).
 */
export function parseTranscriptJson(
  raw: string,
): { ok: true; segments: TranscriptSegment[] | null } | { ok: false; error: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: true, segments: null }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return { ok: false, error: 'Not valid JSON' }
  }

  const candidate = Array.isArray(parsed)
    ? parsed
    : (parsed as Record<string, unknown> | null)?.segments

  const segments = asTranscriptSegments(candidate)
  if (!segments) {
    return {
      ok: false,
      error: 'Expected an array of { timestamp: "M:SS", seconds: number, text: string } segments (or { segments: [...] })',
    }
  }
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].seconds < segments[i - 1].seconds) {
      return { ok: false, error: `Segments out of order at index ${i} (${segments[i - 1].timestamp} → ${segments[i].timestamp})` }
    }
  }
  return { ok: true, segments }
}
