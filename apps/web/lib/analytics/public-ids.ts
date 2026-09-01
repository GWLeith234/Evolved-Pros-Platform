/**
 * Audience-analytics IDs for platform.evolvedpros.com.
 *
 * All three integrations are optional. Empty / whitespace env values mean
 * the corresponding tag or meta must not render. Never hardcode measurement
 * or verification tokens here.
 */

function readPublicId(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** GA4 measurement ID (`G-XXXXXXXX`). */
export function getGaMeasurementId(
  value: string | undefined = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
): string | undefined {
  const id = readPublicId(value)
  if (!id) return undefined
  // gtag measurement IDs only — reject GTM containers and other prefixes.
  if (!/^G-[A-Z0-9]+$/.test(id)) return undefined
  return id
}

/**
 * Google Search Console HTML-tag verification token
 * (`<meta name="google-site-verification" content="…">`).
 */
export function getGscVerification(
  value: string | undefined = process.env.NEXT_PUBLIC_GSC_VERIFICATION,
): string | undefined {
  const id = readPublicId(value)
  if (!id) return undefined
  // Reject values that would break or inject into the meta tag.
  if (/[\s<>"'`]/.test(id)) return undefined
  return id
}

/** Microsoft Clarity project ID. */
export function getClarityId(
  value: string | undefined = process.env.NEXT_PUBLIC_CLARITY_ID,
): string | undefined {
  const id = readPublicId(value)
  if (!id) return undefined
  if (!/^[A-Za-z0-9]+$/.test(id)) return undefined
  return id
}
