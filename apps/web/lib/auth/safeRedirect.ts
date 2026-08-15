/**
 * SPRINT I Phase 2 follow-up — post-login return-path sanitizer.
 *
 * Gated CTAs (the /pricing checkout buttons, and anything else that gets a 401
 * from an API route) send the member to /login?redirect=<path>. That value is
 * attacker-controllable via a crafted link, so it must never be trusted as a
 * redirect target: only same-origin relative paths survive.
 *
 * Scope note — this is NOT a second copy of the guard in (auth)/auth/callback,
 * and the two must not be collapsed into one. LoginForm deliberately passes
 * ?redirect= through unsanitized because every path it takes funnels through
 * /auth/callback, which sanitizes ?next= itself (route.ts:16). The login PAGE
 * is the opposite case: its already-signed-in branch calls next/navigation's
 * redirect() directly, so the callback never sees the value and there is no
 * downstream guard. next/navigation's redirect() honours absolute URLs, so an
 * unchecked value there is a live open redirect. This function is that path's
 * only guard.
 *
 * Rejected: absolute URLs ('https://evil.com'), protocol-relative ('//evil.com'),
 * scheme payloads ('javascript:…', 'data:…'), and anything not rooted at '/'.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = '/home'): string {
  if (!raw) return fallback
  if (!raw.startsWith('/')) return fallback
  if (raw.startsWith('//')) return fallback
  return raw
}
