/**
 * SPRINT I-2b — post-login return-path sanitizer.
 *
 * Gated CTAs (the /pricing checkout buttons, and anything else that gets a 401
 * from an API route) send the member to /login?redirect=<path>. That value is
 * attacker-controllable via a crafted link, so it must never be trusted as a
 * redirect target: only same-origin relative paths survive.
 *
 * Mirrors the guard already applied server-side in (auth)/auth/callback — this
 * one keeps a hostile value from reaching the URL in the first place.
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
