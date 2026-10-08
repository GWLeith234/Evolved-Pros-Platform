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
      details: LEAK.details,
      hint: LEAK.hint,
    })
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
