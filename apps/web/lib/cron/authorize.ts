/**
 * Bearer gate for public /api/cron handlers.
 *
 * Fail closed when CRON_SECRET is unset or whitespace-only. A template
 * string `Bearer ${process.env.CRON_SECRET}` turns a missing env var into
 * the literal credential "Bearer undefined", which any caller can send.
 * A whitespace-only value is the same hole. A real secret is kept
 * byte-for-byte, including any surrounding spaces.
 *
 * JavaScript `===` / `!==` returns as soon as a character differs, so a
 * remote caller can recover the secret one byte at a time. These routes
 * are the only gate (middleware lists /api/cron as public) and several of
 * them run service-role work, including downgrading paid members. Hash
 * both sides and compare the digests so a wrong guess does not leak the
 * secret through that early exit.
 */

import { createHash, timingSafeEqual } from 'node:crypto'

export type CronBearerGate =
  | { ok: true }
  | { ok: false; status: 401 | 500; error: string }

function configuredSecret(secret: string | undefined): string | null {
  if (typeof secret !== 'string' || secret.trim() === '') return null
  return secret
}

/** SHA-256 both sides so length and prefix matches are not a timing oracle. */
function secretsEqual(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided, 'utf8').digest()
  const b = createHash('sha256').update(expected, 'utf8').digest()
  return timingSafeEqual(a, b)
}

/**
 * Accept `Authorization: Bearer <secret>`.
 *
 * Pass `xCronSecret` for the jobs that also accept `x-cron-secret`
 * (goal-snapshots, member-nudges, thanks-nudges). Older schedulers send
 * that header; GitHub Actions sends the bearer. Both are the same secret.
 */
export function authorizeCronBearer(
  authorization: string | null,
  secret: string | undefined,
  xCronSecret?: string | null,
): CronBearerGate {
  const expected = configuredSecret(secret)
  if (!expected) {
    return { ok: false, status: 500, error: 'Server misconfiguration' }
  }

  const bearerOk =
    typeof authorization === 'string' &&
    authorization.length > 0 &&
    secretsEqual(authorization, `Bearer ${expected}`)

  const headerOk =
    typeof xCronSecret === 'string' &&
    xCronSecret.length > 0 &&
    secretsEqual(xCronSecret, expected)

  if (!bearerOk && !headerOk) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  return { ok: true }
}
