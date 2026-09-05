/**
 * CoS lock EP-EVENTS-APR28-BOOK-OCT15: NEXT EVENT is the April 28 launch
 * line (never Conquer Local). Upcoming includes the October 15 book.
 * George also locked weekly Masterminds as extra upcoming rows.
 * Titles are the source of truth so banners stay aligned with seed/CMS.
 * No recurrence engine: weekly Masterminds are stored as dated rows.
 */

export const LAUNCH_EVENT_TITLE =
  'Evolved Pros launches April 28 in Las Vegas with special guest Dennis Yu'

export const BOOK_EVENT_TITLE = 'EVOLVED book launches October 15'

export const MASTERMIND_EVENT_TITLE = 'AI Masterminds for Senior Execs'

export const MASTERMIND_EVENT_DETAIL =
  'Starts Oct 2, then every Friday after at 2:00 PM America/Chicago (CST). Professional Tier only.'

export const LOCKED_EVENT_TITLES = [
  LAUNCH_EVENT_TITLE,
  MASTERMIND_EVENT_TITLE,
  BOOK_EVENT_TITLE,
] as const

export function isConquerLocalTitle(title: string): boolean {
  return /conquer local/i.test(title)
}

export function withoutConquerLocal<T extends { title: string }>(events: readonly T[]): T[] {
  return events.filter(e => !isConquerLocalTitle(e.title))
}

export function isLockedEventTitle(title: string): boolean {
  return (LOCKED_EVENT_TITLES as readonly string[]).includes(title)
}

export function pickNextBannerEvent<T extends { title: string; starts_at: string; is_featured?: boolean }>(
  events: readonly T[],
  now: Date = new Date(),
): T | null {
  const usable = withoutConquerLocal(events)
  const launch = usable.find(e => e.title === LAUNCH_EVENT_TITLE)
  if (launch) return launch

  const upcoming = usable
    .filter(e => new Date(e.starts_at).getTime() > now.getTime())
    .slice()
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  const locked = upcoming.filter(e => isLockedEventTitle(e.title))
  if (locked[0]) return locked[0]

  const featured = upcoming.find(e => e.is_featured)
  return featured ?? upcoming[0] ?? null
}

/** Home / lists: next future lock (book, Masterminds) after the launch date. */
export function pickUpcomingLockedEvent<T extends { title: string; starts_at: string }>(
  events: readonly T[],
  now: Date = new Date(),
): T | null {
  const upcoming = withoutConquerLocal(events)
    .filter(e => new Date(e.starts_at).getTime() > now.getTime())
    .slice()
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
  return upcoming.find(e => isLockedEventTitle(e.title)) ?? upcoming[0] ?? null
}
