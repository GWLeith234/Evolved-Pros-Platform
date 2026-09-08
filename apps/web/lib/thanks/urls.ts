import { THANKS_CLAIM_PATH, THANKS_WWW_ORIGIN } from './constants'

/**
 * Claim URL is www-only. Never platform.evolvedpros.com, never APP_URL.
 * FOG stays on /welcome; this lane is /invite/thanks?token=…
 */
export function thanksClaimUrl(token: string, origin: string = THANKS_WWW_ORIGIN): string {
  const trimmed = token.trim()
  const host = origin.replace(/\/+$/, '')
  return `${host}${THANKS_CLAIM_PATH}?token=${encodeURIComponent(trimmed)}`
}

export function isWwwThanksClaimUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'www.evolvedpros.com' &&
      parsed.pathname === THANKS_CLAIM_PATH &&
      Boolean(parsed.searchParams.get('token'))
    )
  } catch {
    return false
  }
}
