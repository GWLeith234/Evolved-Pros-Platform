/**
 * Upcoming *speaking* dates for /live.
 *
 * Rules:
 * - Only real stage / conference / workshop dates belong here.
 * - Product launches (podcast, platform, book) do NOT — they are not speaking events.
 * - Past dates are filtered out at render time; when a speaking date passes, add
 *   its city to `speaking-pins.ts` (if missing) so it stays on the globe + archive.
 *
 * To add a date: push a row with city, country, event title, and CONFIRMED | HOLD.
 */

export interface UpcomingDate {
  date: Date
  city: string
  country: string
  event: string
  tag: 'CONFIRMED' | 'HOLD'
  detail?: string
  linkLabel?: string
  linkUrl?: string
}

/**
 * Editable calendar. Keep this list short and current — the UI auto-hides
 * anything before today so stale rows never show as "upcoming."
 *
 * (Cleared Aug 2026: Apr 28 podcast launch, May 15 platform launch, May 20
 * TVOT Montreal, and Jul 15 book launch were all past and/or not speaking.)
 */
export const UPCOMING_DATES: UpcomingDate[] = [
  // Example (uncomment / replace when a date is locked):
  // {
  //   date: new Date(2026, 9, 14),
  //   city: 'Chicago',
  //   country: 'USA',
  //   event: 'Revenue Leadership Summit',
  //   tag: 'CONFIRMED',
  //   detail: 'Keynote on the EVOLVED Architecture™ for sales leaders.',
  // },
]

/** Start of local calendar day — dates on/after this count as upcoming. */
export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** Upcoming speaking rows only (date ≥ today), soonest first. */
export function getUpcomingSpeakingDates(now = startOfToday()): UpcomingDate[] {
  return UPCOMING_DATES.filter(d => d.date.getTime() >= now.getTime()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  )
}
