/**
 * SPRINT I Phase 2 follow-up — post-login return-path sanitizer.
 *
 * Gated CTAs (the /pricing checkout buttons, and anything else that gets a 401
 * from an API route) send the member to /login?redirect=<path>, which is then
 * carried into /auth/callback as ?next=. Both values arrive from the query
 * string, so a crafted link controls them: they must never be trusted as a
 * redirect target. Only same-origin relative paths survive.
 *
 * Scope note — this is the ONE definition of a safe return path in this
 * codebase. Both redirect paths call it, for different reasons:
 *   - (auth)/auth/callback — sanitizes ?next= before new URL(next, baseUrl).
 *     Every LoginForm path funnels through here, which is why LoginForm itself
 *     passes ?redirect= through untouched: one guard, at the choke point.
 *   - (auth)/login/page — its already-signed-in branch calls next/navigation's
 *     redirect() directly, so the callback never sees the value and there is no
 *     downstream guard. redirect() honours absolute URLs, so this is that
 *     path's only guard.
 * Keep it that way. The callback used to carry its own inline copy, and that
 * copy is what shipped the backslash escape below while this file was already
 * being treated as the guard.
 *
 * Implementation note — do NOT reduce this to string prefix checks. The obvious
 * `startsWith('/') && !startsWith('//')` pair looks sufficient and is not:
 * browsers normalise '\' to '/' when resolving special-scheme URLs, and strip
 * TAB / LF / CR before parsing, so all of these pass both checks and then
 * resolve to https://evil.com/ —
 *
 *     '/\evil.com'   '/\/evil.com'   '/<TAB>/evil.com'   '/<CR>//evil.com'
 *
 * Verified against the WHATWG URL parser, which is the same parser the browser
 * uses. Resolving against a sentinel origin and requiring the origin to survive
 * delegates the decision to that parser, so this cannot drift from real browser
 * behaviour the way a hand-rolled prefix test does.
 *
 * Rejected: absolute URLs ('https://evil.com'), protocol-relative ('//evil.com'),
 * backslash and whitespace variants ('/\evil.com'), scheme payloads
 * ('javascript:…', 'data:…'), non-strings (Next hands searchParams a string[]
 * when a key repeats), and ''.
 */
const SENTINEL_ORIGIN = 'https://safe-redirect.invalid'

export function safeRedirectPath(raw: unknown, fallback = '/home'): string {
  if (typeof raw !== 'string' || raw === '') return fallback

  let url: URL
  try {
    url = new URL(raw, SENTINEL_ORIGIN)
  } catch {
    return fallback
  }
  // Anything that escaped the sentinel origin — absolute, protocol-relative,
  // backslash-normalised, or a non-http scheme — is off-origin. Refuse it.
  if (url.origin !== SENTINEL_ORIGIN) return fallback

  return url.pathname + url.search + url.hash
}
