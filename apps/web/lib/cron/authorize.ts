/**
 * Bearer gate for public /api/cron handlers.
 *
 * Fail closed when CRON_SECRET is unset. A template string
 * `Bearer ${process.env.CRON_SECRET}` turns a missing env var into the
 * literal credential "Bearer undefined", which any caller can send.
 * Middleware lists /api/cron as public, so this check is the only gate.
 */

export type CronBearerGate =
  | { ok: true }
  | { ok: false; status: 401 | 500; error: string }

export function authorizeCronBearer(
  authorization: string | null,
  secret: string | undefined,
): CronBearerGate {
  if (!secret) {
    return { ok: false, status: 500, error: 'Server misconfiguration' }
  }
  if (authorization !== `Bearer ${secret}`) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  return { ok: true }
}
