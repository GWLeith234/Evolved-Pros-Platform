/**
 * LIVE Evolved Pros thank-you mail may only leave from evolvedpros.com
 * or mail.evolvedpros.com. Never reports.evolvex360.com / EVX / resend.dev.
 *
 * RESEND_FROM_EMAIL is the env. Do not hardcode an EVX fallback.
 */

export const THANKS_ALLOWED_FROM_HOSTS = ['evolvedpros.com', 'mail.evolvedpros.com'] as const

const FORBIDDEN_HOST_SUFFIXES = ['evolvex360.com', 'resend.dev'] as const

export function extractEmailAddress(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const angled = trimmed.match(/<([^>]+)>/)
  const candidate = (angled?.[1] ?? trimmed).trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) return null
  return candidate.toLowerCase()
}

export function thanksFromHost(address: string): string {
  return address.split('@')[1] ?? ''
}

export function isAllowedThanksFromHost(host: string): boolean {
  const h = host.trim().toLowerCase()
  return (THANKS_ALLOWED_FROM_HOSTS as readonly string[]).includes(h)
}

export function resolveThanksFromAddress(
  raw: string | undefined | null,
): { ok: true; from: string } | { ok: false; reason: 'missing' | 'invalid' | 'forbidden_host' } {
  const value = (raw ?? '').trim()
  if (!value) return { ok: false, reason: 'missing' }
  const address = extractEmailAddress(value)
  if (!address) return { ok: false, reason: 'invalid' }
  const host = thanksFromHost(address)
  if (FORBIDDEN_HOST_SUFFIXES.some(suffix => host === suffix || host.endsWith(`.${suffix}`))) {
    return { ok: false, reason: 'forbidden_host' }
  }
  if (!isAllowedThanksFromHost(host)) return { ok: false, reason: 'forbidden_host' }
  return { ok: true, from: value }
}
