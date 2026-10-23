/**
 * Provider failures (PostgREST, Storage, thrown client errors) often carry
 * table names, constraint names, SQLSTATE, bucket paths, or row values in
 * `message` / `details` / `hint`. Those strings are useful in the server log
 * and unsafe in a JSON body.
 *
 * Log a redacted copy: emails, phone numbers, bearer tokens, session
 * cookies, and connection secrets are removed. Constraint names and
 * SQLSTATE codes stay. Return the stable message the route already chose.
 * Status codes stay with the caller.
 */

const PROVIDER_FIELDS = ['code', 'message', 'details', 'hint'] as const

function redactSensitive(value: string): string {
  return value
    .replace(
      /\b((?:postgres|postgresql):\/\/[^:\s/@]+:)[^@\s]+@/gi,
      '$1[redacted-secret]@',
    )
    .replace(/\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [redacted-token]')
    .replace(
      /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
      '[redacted-token]',
    )
    .replace(
      /\b(?:dev_session|session|refresh_token|access_token|sb-[A-Za-z0-9-]*auth-token(?:\.\d+)?)=\S+/gi,
      match => `${match.slice(0, match.indexOf('=') + 1)}[redacted-secret]`,
    )
    .replace(
      /([?&](?:token|access_token|refresh_token|apikey|api_key)=)[^&\s]+/gi,
      '$1[redacted-secret]',
    )
    .replace(/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]+\b/g, '[redacted-secret]')
    .replace(/\bwhsec_[A-Za-z0-9]+\b/g, '[redacted-secret]')
    .replace(/\bsb_secret_[A-Za-z0-9_-]+\b/g, '[redacted-secret]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(
      /(?<!\d)(?:\+\d{1,3}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}(?!\d)/g,
      '[redacted-phone]',
    )
    .replace(/(?<!\w)\+\d{10,15}(?!\d)/g, '[redacted-phone]')
}

export function logProviderError(label: string, error: unknown): void {
  const detail: Record<string, string> = {}
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    for (const key of PROVIDER_FIELDS) {
      const value = record[key]
      if (typeof value === 'string' && value.length > 0) detail[key] = redactSensitive(value)
    }
  } else if (typeof error === 'string' && error.length > 0) {
    detail.message = redactSensitive(error)
  }

  console.error(label, Object.keys(detail).length > 0 ? detail : 'unknown')
}

export function clientSafeError(label: string, error: unknown, clientMessage: string): string {
  logProviderError(label, error)
  return clientMessage
}
