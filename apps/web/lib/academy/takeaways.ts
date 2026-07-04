/**
 * Shared validation for lessons.key_takeaways (jsonb array of bullet strings).
 * Used by the admin lesson form (client) and the admin lesson routes (server).
 *
 * ["Takeaway one.", "Takeaway two."] — 2–4 recommended, hard cap 8;
 * each bullet 1–300 chars after trimming. null = field not authored yet
 * (frontend falls back to description-derived bullets).
 */

export const MAX_TAKEAWAYS = 8
export const MAX_TAKEAWAY_LENGTH = 300

/** Runtime-validate an unknown value (e.g. the jsonb column / request body). */
export function asKeyTakeaways(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const out: string[] = []
  for (const item of value) {
    if (typeof item !== 'string') return null
    const text = item.trim()
    if (!text || text.length > MAX_TAKEAWAY_LENGTH) return null
    out.push(text)
  }
  if (out.length === 0 || out.length > MAX_TAKEAWAYS) return null
  return out
}
