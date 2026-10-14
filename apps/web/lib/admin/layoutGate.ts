/**
 * Admin layout access for requests middleware does not role-check.
 *
 * middleware.ts returns before the admin role check on any RSC or prefetch
 * flight, because a redirect there is not a valid RSC payload. This layout
 * is the remaining server-side gate. `RSC: 1` is set on real client
 * navigations as well as prefetches, so it must not be treated as a skip.
 * Only `Next-Router-Prefetch: 1` skips rendering, and it skips children:
 * several admin pages (for example /admin/media) query the service role
 * with no header check of their own.
 *
 * The role comparison matches requireAdminPage / requireAdminApi: exact
 * `admin`, not a logged-in check.
 */

export function adminLayoutPrefetchOmitsChildren(prefetchHeader: string | null): boolean {
  return prefetchHeader === '1'
}

/** Where a non-prefetch admin render should send a caller who is not an admin. */
export function adminLayoutRedirectTarget(input: {
  signedIn: boolean
  role: string | null | undefined
}): '/login' | '/home' | null {
  if (!input.signedIn) return '/login'
  if (input.role !== 'admin') return '/home'
  return null
}
