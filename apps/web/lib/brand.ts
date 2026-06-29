// Brand & author identity — single source of truth (Sprint 6, copy hygiene).
//
// The same person and the same brand were rendering inconsistently across the
// home surfaces: `GEORGE LEI`, `George Leith`, `GEORGE LEITH`, a doubled
// `EVOLVED · EVOLVED`, and mid-word truncations like `EVOLVED — GEOR`. Every
// surface that names the brand or the author must read from here so there is
// exactly one spelling.

/** Canonical brand token. Rendered uppercase via CSS where a label calls for it. */
export const BRAND = 'EVOLVED'

/** Canonical author display name. Never abbreviate or re-case in components. */
export const AUTHOR_NAME = 'George Leith'

/** Canonical "brand — author" lockup (em dash, not hyphen). */
export const BRAND_BYLINE = `${BRAND} — ${AUTHOR_NAME}`

/**
 * Ellipsize on a WORD boundary, never mid-word.
 *   truncateOnWord('EVOLVED — George Leith', 14) → 'EVOLVED —…'
 *   truncateOnWord('George Leith', 20)           → 'George Leith'
 *
 * If even the first word overflows `max`, it is hard-cut (a single long word
 * has no boundary to break on) so the result still respects the budget. A
 * trailing em dash / separator left dangling before the ellipsis is trimmed so
 * we never render `EVOLVED — …`.
 */
export function truncateOnWord(text: string, max: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed

  // Reserve one char for the ellipsis.
  const budget = Math.max(1, max - 1)
  const slice = trimmed.slice(0, budget)
  const lastSpace = slice.lastIndexOf(' ')

  let head = lastSpace > 0 ? slice.slice(0, lastSpace) : slice
  // Drop any dangling separator/punctuation so we don't render "EVOLVED — …".
  head = head.replace(/[\s—–\-·•|,;:]+$/u, '')
  if (!head) head = slice // first word longer than budget → hard cut

  return `${head}…`
}

/**
 * Strip a trailing arrow (and surrounding space) that a stored CTA label may
 * already contain, so components can append their own arrow icon without
 * producing a doubled-arrow CTA.
 *   stripTrailingArrow('Learn More →') → 'Learn More'
 *   stripTrailingArrow('Learn More')   → 'Learn More'
 */
export function stripTrailingArrow(label: string): string {
  return label.replace(/[\s]*[→›>»]+\s*$/u, '').trim()
}
