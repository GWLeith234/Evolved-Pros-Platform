import { describe, expect, it } from 'vitest'
import {
  HERO_DB_REJECTED,
  PG_CHECK_VIOLATION,
  mediaStoryWriteFailure,
} from './mediaStoryWrite'

describe('media story write errors', () => {
  it('maps the hero trigger check_violation to a 422', () => {
    expect(mediaStoryWriteFailure({
      code: PG_CHECK_VIOLATION,
      message: 'media_stories slug: cannot publish without featured_image_url',
    })).toEqual({ status: 422, error: HERO_DB_REJECTED })
    expect(PG_CHECK_VIOLATION).toBe('23514')
  })

  it('leaves other database errors as 500', () => {
    expect(mediaStoryWriteFailure({
      code: '23505',
      message: 'duplicate key value',
    })).toEqual({ status: 500, error: 'duplicate key value' })
    expect(mediaStoryWriteFailure({})).toEqual({ status: 500, error: 'Save failed' })
  })
})
