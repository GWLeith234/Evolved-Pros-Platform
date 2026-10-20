/**
 * Logged-out /home is a legacy member URL. Google still lists it, and a
 * temporary hop to /login (disallowed in robots.txt) strands that equity
 * on a page crawlers are told not to fetch.
 *
 * Anonymous requests for the member home index permanently redirect to the
 * public homepage. Every other protected path keeps the temporary
 * /login?redirect= flow. Callers decide "logged out" from the session.
 * This module never reads User-Agent.
 */

export const LOGGED_OUT_MEMBER_HOME_STATUS = 308 as const

export function isMemberHomeIndex(pathname: string): boolean {
  const pathOnly = pathname.split(/[?#]/)[0] ?? ''
  return pathOnly === '/home' || pathOnly === '/home/'
}
