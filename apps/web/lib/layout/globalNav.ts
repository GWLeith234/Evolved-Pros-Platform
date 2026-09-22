/**
 * Global platform nav model (SPRINT M).
 *
 * /media, /fit and /live each replaced the app shell with a single "Back to
 * platform" link, so three of the seven nav destinations were cul-de-sacs: a
 * reader who landed on an article from search had one door, and it was the one
 * marked exit. This is the persistent rail those three sections mount instead.
 *
 * Deliberately session-blind. All three sections are ISR/statically rendered
 * for anonymous crawlers; reading the session here would force them dynamic.
 * The member destinations (/home, /community, /academy) are guarded by
 * middleware, which sends a signed-out visitor to /login - a door, not a wall.
 *
 * Extracted from the component for the same reason as lib/layout/publicFooter:
 * vitest only collects lib/**, and the label/href contract is the part worth a
 * regression test.
 *
 * DEPENDENCY-FREE ON PURPOSE - imports nothing.
 */

export interface GlobalNavLink {
  /** Exact visible label. */
  label: string
  href: string
}

/**
 * The seven platform destinations, in TopNav order. Keep this in step with
 * NAV_ITEMS in components/layout/TopNav.tsx - same seven, same order, so the
 * public sections and the member shell agree on what the platform contains.
 */
export const GLOBAL_NAV_LINKS: readonly GlobalNavLink[] = [
  { label: 'Home', href: '/home' },
  { label: 'Community', href: '/community' },
  { label: 'Academy', href: '/academy' },
  { label: 'LIVE', href: '/live' },
  { label: 'Podcast', href: '/podcast' },
  { label: 'Media', href: '/media' },
  { label: 'Fit', href: '/fit' },
]

/** The single CTA on the rail. Lands on the live sell page, never /join. */
export const GLOBAL_NAV_CTA: GlobalNavLink = { label: 'Join free', href: '/pricing' }

/**
 * Which rail entry is the section the visitor is already in. Exact match, or a
 * child route of it (/media/strategy/foo is still Media). `/` matches nothing.
 */
export function isGlobalNavCurrent(href: string, pathname: string): boolean {
  if (!pathname || pathname === '/') return false
  return pathname === href || pathname.startsWith(`${href}/`)
}
