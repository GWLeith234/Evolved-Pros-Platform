import { afterEach, describe, expect, it, vi } from 'vitest'
import { clientSafeError } from '@/lib/http/clientError'

const LEAK = {
  code: '23505',
  message: 'duplicate key value violates unique constraint "users_email_key"',
  details: 'Key (email)=(secret@example.com) already exists.',
  hint: 'See public.users',
}

describe('clientSafeError', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the stable client message and logs provider detail', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const body = clientSafeError('[test]', LEAK, 'Could not save.')

    expect(body).toBe('Could not save.')
    expect(body).not.toContain('secret@example.com')
    expect(body).not.toContain('users_email_key')
    expect(body).not.toContain('23505')
    expect(spy).toHaveBeenCalledWith('[test]', {
      code: LEAK.code,
      message: LEAK.message,
      details: 'Key (email)=([redacted-email]) already exists.',
      hint: LEAK.hint,
    })
    const logged = JSON.stringify(spy.mock.calls)
    expect(logged).not.toContain('secret@example.com')
    expect(logged).toContain('users_email_key')
    expect(logged).toContain('23505')
  })

  it('redacts phones, tokens, cookies, and connection secrets from the log', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.sigvaluehere'
    const error = {
      code: '28000',
      message: `Bearer ${jwt}`,
      details: 'phone 555-010-0199 cookie sb-projref-auth-token=sessionsecretvalue',
      hint: 'postgresql://postgres:super-secret-pass@db.internal:5432/postgres sk_live_abc123def456',
    }

    const body = clientSafeError('[test]', error, 'Could not save.')

    expect(body).toBe('Could not save.')
    const logged = JSON.stringify(spy.mock.calls)
    expect(logged).not.toContain('555-010-0199')
    expect(logged).not.toContain(jwt)
    expect(logged).not.toContain('sessionsecretvalue')
    expect(logged).not.toContain('super-secret-pass')
    expect(logged).not.toContain('sk_live_abc123def456')
    expect(logged).toContain('[redacted-phone]')
    expect(logged).toContain('Bearer [redacted-token]')
    expect(logged).toContain('sb-projref-auth-token=[redacted-secret]')
    expect(logged).toContain('postgresql://postgres:[redacted-secret]@')
    expect(logged).toContain('[redacted-secret]')
    expect(logged).toContain('28000')
  })

  it('logs a thrown Error message without returning it', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = new Error('connect ECONNREFUSED 10.0.0.8:5432')

    const body = clientSafeError('[test]', err, 'Upload failed.')

    expect(body).toBe('Upload failed.')
    expect(body).not.toContain('ECONNREFUSED')
    expect(spy).toHaveBeenCalledWith('[test]', { message: err.message })
  })

  it('logs unknown when the failure has no detail', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(clientSafeError('[test]', null, 'Upload failed.')).toBe('Upload failed.')
    expect(spy).toHaveBeenCalledWith('[test]', 'unknown')
  })
})
