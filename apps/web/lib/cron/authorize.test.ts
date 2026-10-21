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
  'app/api/cron/media-image-check/route.ts',
]

/** Routes that compared CRON_SECRET with === / !== in the handler. */
const STRING_EQUAL_ROUTES = [
  'app/api/cron/expire-tiers/route.ts',
  'app/api/cron/renewal-reminders/route.ts',
  'app/api/cron/goal-snapshots/route.ts',
  'app/api/cron/member-nudges/route.ts',
  'app/api/cron/thanks-nudges/route.ts',
]

const X_CRON_SECRET_ROUTES = [
  'app/api/cron/goal-snapshots/route.ts',
  'app/api/cron/member-nudges/route.ts',
  'app/api/cron/thanks-nudges/route.ts',
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

  it('fails closed when the secret is whitespace only', () => {
    expect(authorizeCronBearer('Bearer    ', '   ')).toEqual({
      ok: false,
      status: 500,
      error: 'Server misconfiguration',
    })
    expect(authorizeCronBearer('Bearer \n\t', ' \n\t')).toEqual({
      ok: false,
      status: 500,
      error: 'Server misconfiguration',
    })
  })

  it('rejects a same-length and a different-length wrong secret', () => {
    expect(authorizeCronBearer('Bearer cron-secreT', 'cron-secret')).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    })
    expect(authorizeCronBearer('Bearer cron-secret-extra', 'cron-secret')).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    })
    expect(authorizeCronBearer('Bearer cron', 'cron-secret')).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    })
  })

  it('keeps surrounding spaces in a real secret', () => {
    const secret = '  cron-secret  '
    expect(authorizeCronBearer(`Bearer ${secret}`, secret)).toEqual({ ok: true })
    expect(authorizeCronBearer('Bearer cron-secret', secret)).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    })
  })

  it('accepts x-cron-secret as the same credential and rejects a wrong one', () => {
    expect(authorizeCronBearer(null, 'cron-secret', 'cron-secret')).toEqual({ ok: true })
    expect(authorizeCronBearer('Bearer nope', 'cron-secret', 'cron-secret')).toEqual({ ok: true })
    expect(authorizeCronBearer(null, 'cron-secret', 'nope')).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    })
    expect(authorizeCronBearer(null, 'cron-secret', '')).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    })
    expect(authorizeCronBearer(null, 'cron-secret', null)).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    })
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

  it('wires the string-equality jobs through the timing-safe gate', () => {
    for (const rel of STRING_EQUAL_ROUTES) {
      const route = src(rel)
      expect(route).toContain('authorizeCronBearer')
      expect(route).not.toContain('Bearer ${process.env.CRON_SECRET}')
      expect(route).not.toMatch(/[!=]==\s*`Bearer/)
      expect(route).not.toMatch(/xSecret\s*===/)
      expect(route).not.toMatch(/===\s*expected/)
    }
    for (const rel of X_CRON_SECRET_ROUTES) {
      expect(src(rel)).toContain("request.headers.get('x-cron-secret')")
    }
  })

  it('compares the secret with a digest, not string equality', () => {
    const helper = src('lib/cron/authorize.ts')
    expect(helper).toContain('timingSafeEqual')
    expect(helper).toContain("createHash('sha256')")
    expect(helper).not.toMatch(/authorization\s*!==/)
    expect(helper).not.toMatch(/authorization\s*===\s*`/)
  })

  it('leaves the keep-warm ping public', () => {
    const warmup = src('app/api/cron/warmup/route.ts')
    expect(warmup).not.toContain('CRON_SECRET')
    expect(warmup).not.toContain('authorizeCronBearer')
  })
})
