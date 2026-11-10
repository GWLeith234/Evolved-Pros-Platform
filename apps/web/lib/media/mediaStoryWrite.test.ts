import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  HERO_DB_REJECTED,
  PG_CHECK_VIOLATION,
  mediaStoryWriteFailure,
} from './mediaStoryWrite'

describe('media story write errors', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps the hero trigger check_violation to a 422', () => {
    expect(mediaStoryWriteFailure({
      code: PG_CHECK_VIOLATION,
      message: 'media_stories slug: cannot publish without featured_image_url',
    })).toEqual({ status: 422, error: HERO_DB_REJECTED })
    expect(PG_CHECK_VIOLATION).toBe('23514')
  })

  it('hides other database errors behind a stable 500 and a redacted log', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const failure = mediaStoryWriteFailure({
      code: '23505',
      message: 'duplicate key value violates unique constraint "users_email_key"',
      details: 'Key (email)=(secret@example.com) already exists.',
    })

    expect(failure).toEqual({ status: 500, error: 'Save failed' })
    const logged = JSON.stringify(spy.mock.calls)
    expect(logged).toContain('users_email_key')
    expect(logged).toContain('23505')
    expect(logged).toContain('[redacted-email]')
    expect(logged).not.toContain('secret@example.com')
    expect(mediaStoryWriteFailure({})).toEqual({ status: 500, error: 'Save failed' })
  })
})
