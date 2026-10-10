import { describe, expect, it } from 'vitest'
import { PILLAR_SLUGS } from '@/lib/pillars'
import { dbRowToEpisode, PILLAR_ORDER, type EpisodeRow } from './transforms'

function row(pillar: string | null): EpisodeRow {
  return {
    id: 'ep-1',
    slug: 'ep-1',
    episode_number: 1,
    title: 'Title',
    description: null,
    pillar,
    pinned: false,
    guest_name: null,
    guest_title: null,
    guest_company: null,
    guest_image_url: null,
    thumbnail_url: null,
    duration_seconds: null,
    published_at: '2026-01-01T00:00:00.000Z',
    youtube_url: null,
  }
}

describe('episode pillar slugs', () => {
  it('keeps the filter order aligned with the shared slug list', () => {
    expect([...PILLAR_ORDER]).toEqual([...PILLAR_SLUGS])
  })

  it('keeps a known slug and falls back unknown values to foundation', () => {
    expect(dbRowToEpisode(row('mental-toughness')).pillar).toBe('mental-toughness')
    expect(dbRowToEpisode(row('mental')).pillar).toBe('foundation')
    expect(dbRowToEpisode(row(null)).pillar).toBe('foundation')
    expect(dbRowToEpisode(row('')).pillar).toBe('foundation')
  })
})
