import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { authorizeCronBearer } from './authorize'

const webRoot = resolve(__dirname, '../..')

function src(rel: string) {
  return readFileSync(resolve(webRoot, rel), 'utf8')
}

/** Routes that used to interpolate an unset CRON_SECRET into the Bearer check. */
const FAIL_OPEN_ROUTES = [
  'app/api/cron/daily-digest/route.ts',
  'app/api/cron/event-reminders/route.ts',
  'app/api/cron/podcast-sync/route.ts',
  'app/api/cron/publish-posts/route.ts',
]

describe('authorizeCronBearer', () => {
  it('fails closed when the secret is missing, including the Bearer undefined footgun', () => {
    expect(authorizeCronBearer('Bearer undefined', undefined)).toEqual({
      ok: false,
      status: 500,
      error: 'Server misconfiguration',
    })
    expect(authorizeCronBearer('Bearer undefined', '')).toEqual({
      ok: false,
      status: 500,
      error: 'Server misconfiguration',
    })
    expect(authorizeCronBearer(null, undefined)).toEqual({
      ok: false,
      status: 500,
      error: 'Server misconfiguration',
    })
  })

  it('rejects a missing or wrong bearer when the secret is set', () => {
    expect(authorizeCronBearer(null, 'cron-secret')).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    })
    expect(authorizeCronBearer('Bearer nope', 'cron-secret')).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    })
    expect(authorizeCronBearer('bearer cron-secret', 'cron-secret')).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    })
  })

  it('accepts the exact Authorization bearer the scheduler sends', () => {
    expect(authorizeCronBearer('Bearer cron-secret', 'cron-secret')).toEqual({ ok: true })
  })
})

describe('cron route secret lock', () => {
  it('wires the previously fail-open jobs through the closed gate', () => {
    for (const rel of FAIL_OPEN_ROUTES) {
      const route = src(rel)
      expect(route).toContain('authorizeCronBearer')
      expect(route).not.toContain('Bearer ${process.env.CRON_SECRET}')
    }
  })

  it('leaves the keep-warm ping public', () => {
    const warmup = src('app/api/cron/warmup/route.ts')
    expect(warmup).not.toContain('CRON_SECRET')
    expect(warmup).not.toContain('authorizeCronBearer')
  })
})
