import { describe, expect, it } from 'vitest'
import {
  buildDraftEpisodeRow,
  episodeThumbnailFromRss,
  parseDuration,
  pickGuid,
  uniqueSlug,
} from './rssSync'

describe('pickGuid', () => {
  it('reads string and #text forms', () => {
    expect(pickGuid('124107842')).toBe('124107842')
    expect(pickGuid({ '#text': '124366491' })).toBe('124366491')
  })

  it('rejects empty', () => {
    expect(pickGuid(undefined)).toBeNull()
    expect(pickGuid('')).toBeNull()
    expect(pickGuid({ '#text': '  ' })).toBeNull()
  })
})

describe('episodeThumbnailFromRss', () => {
  it('uses per-item itunes:image when present', () => {
    expect(
      episodeThumbnailFromRss({
        'itunes:image': { '@_href': 'https://cdn.example/guest.jpg' },
      }),
    ).toBe('https://cdn.example/guest.jpg')
  })

  it('does not invent a thumbnail when the item has no image', () => {
    // Channel artwork must never be written here — it buries guest portraits.
    expect(episodeThumbnailFromRss({})).toBeNull()
    expect(episodeThumbnailFromRss({ 'itunes:image': {} })).toBeNull()
  })
})

describe('buildDraftEpisodeRow', () => {
  it('lands unpublished with null published_at (platform-release semantics)', () => {
    const row = buildDraftEpisodeRow(
      {
        title: 'Guest Talk',
        pubDate: 'Mon, 01 Jun 2026 12:00:00 GMT',
        'itunes:episode': 8,
        'itunes:duration': '1:02:03',
        enclosure: { '@_url': 'https://media.example/ep8.mp3' },
      },
      '124107842',
      'guest-talk',
    )

    expect(row.is_published).toBe(false)
    expect(row.published_at).toBeNull()
    expect(row.transistor_episode_id).toBe('124107842')
    expect(row.episode_number).toBe(8)
    expect(row.duration_seconds).toBe(3723)
    expect(row.thumbnail_url).toBeNull()
  })
})

describe('uniqueSlug', () => {
  it('appends episode number on collision', () => {
    const taken = new Set(['guest-talk'])
    expect(uniqueSlug('Guest Talk', 'abc', 8, taken)).toBe('guest-talk-8')
  })
})

describe('parseDuration', () => {
  it('parses HH:MM:SS and raw seconds', () => {
    expect(parseDuration('1:02:03')).toBe(3723)
    expect(parseDuration(90)).toBe(90)
  })
})
