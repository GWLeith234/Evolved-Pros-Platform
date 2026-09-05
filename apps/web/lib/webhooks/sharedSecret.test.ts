import { afterEach, describe, expect, it } from 'vitest'
import {
  CONVERSATIONS_WEBHOOK_SECRET_ENV,
  CONVERSATIONS_WEBHOOK_SECRET_HEADER,
  authorizeConversationsWebhook,
  readProvidedSecret,
  verifySharedSecret,
} from './sharedSecret'

describe('readProvidedSecret', () => {
  it('reads x-webhook-secret', () => {
    const headers = new Headers({ [CONVERSATIONS_WEBHOOK_SECRET_HEADER]: ' s3cret ' })
    expect(readProvidedSecret(headers)).toBe('s3cret')
  })

  it('falls back to Authorization Bearer', () => {
    const headers = new Headers({ authorization: 'Bearer tok-1' })
    expect(readProvidedSecret(headers)).toBe('tok-1')
  })

  it('prefers the dedicated header over Bearer', () => {
    const headers = new Headers({
      [CONVERSATIONS_WEBHOOK_SECRET_HEADER]: 'header-secret',
      authorization: 'Bearer other',
    })
    expect(readProvidedSecret(headers)).toBe('header-secret')
  })

  it('returns null when nothing is present', () => {
    expect(readProvidedSecret(new Headers())).toBeNull()
  })
})

describe('verifySharedSecret', () => {
  it('fails closed when the env secret is missing', () => {
    expect(verifySharedSecret('anything', undefined)).toEqual({
      ok: false,
      status: 503,
      error: 'Webhook not configured',
    })
    expect(verifySharedSecret('anything', '   ')).toEqual({
      ok: false,
      status: 503,
      error: 'Webhook not configured',
    })
  })

  it('rejects a missing header', () => {
    expect(verifySharedSecret(null, 's3cret')).toEqual({
      ok: false,
      status: 401,
      error: 'Missing webhook secret',
    })
  })

  it('rejects the wrong secret', () => {
    expect(verifySharedSecret('nope', 's3cret')).toEqual({
      ok: false,
      status: 401,
      error: 'Invalid webhook secret',
    })
  })

  it('accepts an exact match', () => {
    expect(verifySharedSecret('s3cret', 's3cret')).toEqual({ ok: true })
  })
})

describe('authorizeConversationsWebhook', () => {
  const prev = process.env[CONVERSATIONS_WEBHOOK_SECRET_ENV]

  afterEach(() => {
    if (prev === undefined) delete process.env[CONVERSATIONS_WEBHOOK_SECRET_ENV]
    else process.env[CONVERSATIONS_WEBHOOK_SECRET_ENV] = prev
  })

  it('rejects a request when the secret header is wrong', () => {
    process.env[CONVERSATIONS_WEBHOOK_SECRET_ENV] = 'expected-secret'
    const result = authorizeConversationsWebhook(
      new Headers({ [CONVERSATIONS_WEBHOOK_SECRET_HEADER]: 'wrong' }),
    )
    expect(result).toEqual({ ok: false, status: 401, error: 'Invalid webhook secret' })
  })

  it('rejects a request when the secret header is missing', () => {
    process.env[CONVERSATIONS_WEBHOOK_SECRET_ENV] = 'expected-secret'
    expect(authorizeConversationsWebhook(new Headers())).toEqual({
      ok: false,
      status: 401,
      error: 'Missing webhook secret',
    })
  })

  it('accepts a matching x-webhook-secret header', () => {
    process.env[CONVERSATIONS_WEBHOOK_SECRET_ENV] = 'expected-secret'
    expect(
      authorizeConversationsWebhook(
        new Headers({ [CONVERSATIONS_WEBHOOK_SECRET_HEADER]: 'expected-secret' }),
      ),
    ).toEqual({ ok: true })
  })
})

describe('verifySharedSecret copy', () => {
  it('does not contain em dashes in error copy', () => {
    const misses = [
      verifySharedSecret(null, undefined),
      verifySharedSecret(null, 'x'),
      verifySharedSecret('a', 'b'),
    ]
    for (const result of misses) {
      if (result.ok) throw new Error('expected failure')
      expect(result.error).not.toContain('—')
    }
  })
})
