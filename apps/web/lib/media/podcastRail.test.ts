import { describe, expect, it } from 'vitest'
import { episodeRailStill, episodeWatchHref, episodeWatchIsExternal } from './podcastRail'

describe('episodeWatchHref', () => {
  it('uses the stored YouTube URL and does not invent one', () => {
    expect(
      episodeWatchHref({
        youtube_url: 'https://www.youtube.com/watch?v=abcDEFghijk',
        slug: 'heather-monahan',
      }),
    ).toBe('https://www.youtube.com/watch?v=abcDEFghijk')
  })

  it('falls back to the platform episode page when YouTube is missing', () => {
    expect(episodeWatchHref({ youtube_url: null, slug: 'heather-monahan' })).toBe(
      '/podcast/heather-monahan',
    )
    expect(episodeWatchHref({ youtube_url: '', slug: 'heather-monahan' })).toBe(
      '/podcast/heather-monahan',
    )
  })

  it('never returns a dead hash', () => {
    expect(episodeWatchHref({ youtube_url: null, slug: '' })).toBe('/podcast')
    expect(episodeWatchHref({ youtube_url: 'not-a-url', slug: 'x' })).toBe('/podcast/x')
  })

  it('marks stored YouTube as external and platform pages as internal', () => {
    expect(episodeWatchIsExternal('https://youtu.be/abcDEFghijk')).toBe(true)
    expect(episodeWatchIsExternal('/podcast/heather-monahan')).toBe(false)
  })
})

describe('episodeRailStill', () => {
  it('prefers the guest still over the episode thumbnail', () => {
    expect(
      episodeRailStill({
        guest_image_url: 'https://cdn.example/heather.jpg',
        thumbnail_url: 'https://cdn.example/ep.jpg',
      }),
    ).toBe('https://cdn.example/heather.jpg')
  })

  it('falls back to the episode thumbnail and never invents a face', () => {
    expect(
      episodeRailStill({
        guest_image_url: null,
        thumbnail_url: 'https://cdn.example/ep.jpg',
      }),
    ).toBe('https://cdn.example/ep.jpg')
    expect(episodeRailStill({ guest_image_url: null, thumbnail_url: null })).toBeNull()
  })
})
