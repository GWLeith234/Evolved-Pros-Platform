/**
 * George-locked event copy and the picker for NEXT EVENT / upcoming pins.
 * Titles are the source of truth so banners stay aligned with seed/CMS rows.
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

export function isLockedEventTitle(title: string): boolean {
  return (LOCKED_EVENT_TITLES as readonly string[]).includes(title)
}

export function pickNextBannerEvent<T extends { title: string; starts_at: string; is_featured?: boolean }>(
  events: readonly T[],
  now: Date = new Date(),
): T | null {
  const upcoming = events
    .filter(e => !isConquerLocalTitle(e.title) && new Date(e.starts_at).getTime() > now.getTime())
    .slice()
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  const locked = upcoming.filter(e => isLockedEventTitle(e.title))
  if (locked[0]) return locked[0]

  const featured = upcoming.find(e => e.is_featured)
  return featured ?? upcoming[0] ?? null
}
