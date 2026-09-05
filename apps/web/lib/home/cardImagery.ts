/** Member Home Fuel card stills (S5). No stock people. No em dashes. */

export const ACADEMY_STILL_LIGHT = '/academy/architecture-still-light.svg'
export const ACADEMY_STILL_DARK = '/academy/architecture-still-dark.svg'
export const ACADEMY_STILL_ALT = 'Evolved Pros Academy architecture'

/** Display titles must not show em or en dashes. */
export function stripEmDashCopy(copy: string): string {
  return copy
    .replace(/\s*[\u2014\u2013]\s*/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
