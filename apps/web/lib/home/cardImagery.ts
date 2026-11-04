/** Member Home Fuel card stills (S5). No stock people. No em dashes. */

/**
 * Public stills. Never under /academy or /events: middleware matches those
 * prefixes as the member app and 307s anonymous requests to /login.
 */
export const ACADEMY_STILL_LIGHT = '/brand/architecture-still-light.svg'
export const ACADEMY_STILL_DARK = '/brand/architecture-still-dark.svg'
export const ACADEMY_STILL_ALT = 'Evolved Pros Academy architecture'

/**
 * Display copy must not show em or en dashes.
 *
 * A dash before the word "with" is a clause join
 * ("reinvention" + dash + "with George Leith"), not a new sentence.
 * A period there publishes "reinvention. with". A comma keeps the
 * credit grammatical. A dash before any other word still becomes a period.
 */
export function stripEmDashCopy(copy: string): string {
  return copy
    .replace(/\s*[\u2014\u2013]\s*(?=with\b)/g, ', ')
    .replace(/\s*[\u2014\u2013]\s*/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
