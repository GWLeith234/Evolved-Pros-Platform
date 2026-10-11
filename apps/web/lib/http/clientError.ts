/**
 * Provider failures (PostgREST, Storage, thrown client errors) often carry
 * table names, constraint names, SQLSTATE, bucket paths, or row values in
 * `message` / `details` / `hint`. Those strings are useful in the server log
 * and unsafe in a JSON body.
 *
 * Log the detail, return a stable message the route already chose. Status
 * codes stay with the caller.
 */

const PROVIDER_FIELDS = ['code', 'message', 'details', 'hint'] as const

export function clientSafeError(label: string, error: unknown, clientMessage: string): string {
  const detail: Record<string, string> = {}
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    for (const key of PROVIDER_FIELDS) {
      const value = record[key]
      if (typeof value === 'string' && value.length > 0) detail[key] = value
    }
  } else if (typeof error === 'string' && error.length > 0) {
    detail.message = error
  }

  console.error(label, Object.keys(detail).length > 0 ? detail : 'unknown')
  return clientMessage
}
