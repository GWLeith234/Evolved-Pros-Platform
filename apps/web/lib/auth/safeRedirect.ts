/**
 * SPRINT I Phase 2 follow-up — post-login return-path sanitizer.
 *
 * Gated CTAs (the /pricing checkout buttons, and anything else that gets a 401
 * from an API route) send the member to /login?redirect=<path>, which is then
 * carried into /auth/callback as ?next=. Both values arrive from the query
 * string, so a crafted link controls them: they must never be trusted as a
 * redirect target. Only same-origin relative paths survive.
 *
 * WHY THIS PARSES INSTEAD OF PREFIX-MATCHING. The obvious guard —
 * `raw.startsWith('/') && !raw.startsWith('//')` — is not sufficient, because
 * it does not agree with the URL parser that ultimately resolves the value.
 * The parser treats a backslash as an authority separator and strips tab / LF /
 * CR before parsing, so all of these pass a prefix check and then resolve
 * off-origin:
 *
 *     '/\evil.com'    -> https://evil.com/
 *     '/\/evil.com'   -> https://evil.com/
 *     '/<TAB>/evil.com'  -> https://evil.com/
 *     '/<CR>//evil.com'  -> https://evil.com/
 *
 * So we resolve against a throwaway probe origin using the SAME parser that
 * will resolve it downstream, and require the origin to come back unchanged.
 * Anything that reaches for an authority — however it spells it — changes the
 * origin and is rejected. The return value is the reparsed path, so callers
 * get a normalized same-origin path rather than the raw input.
 *
 * Used by both redirect paths, which is deliberate — there is one definition
 * of "safe return path" in this codebase, not one per call site:
 *   - (auth)/auth/callback  — sanitizes ?next= before new URL(next, baseUrl).
 *     Every LoginForm path funnels through here, which is why LoginForm itself
 *     passes ?redirect= through untouched.
 *   - (auth)/login/page     — its already-signed-in branch calls
 *     next/navigation's redirect() directly, never reaching the callback.
 *     redirect() honours absolute URLs, so this is that path's only guard.
 */

// Not a real origin — only ever used as a parse base, never fetched.
const PROBE_ORIGIN = 'https://redirect-probe.invalid'

export function safeRedirectPath(raw: string | null | undefined, fallback = '/home'): string {
  if (!raw) return fallback
  // Must be rooted: bare 'evil.com' would otherwise resolve same-origin and be
  // returned as '/evil.com', silently rewriting the caller's intent.
  if (!raw.startsWith('/')) return fallback

  let url: URL
  try {
    url = new URL(raw, PROBE_ORIGIN)
  } catch {
    return fallback
  }
  // Any attempt to reach another host changes the origin.
  if (url.origin !== PROBE_ORIGIN) return fallback

  return url.pathname + url.search + url.hash
}
