import { beforeEach, describe, expect, it, vi } from 'vitest'

const limit = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: () => ({
      select: () => ({
        limit,
      }),
    }),
  },
}))

import {
  EVENT_CITY_COLUMN_MISS_TTL_MS,
  eventsHaveCityColumn,
  resetEventCityColumnCache,
} from './eventColumns'
import {
  EVENT_CATALOG_COLUMNS,
  EVENT_PRIVILEGED_COLUMNS,
  eventCityFromRow,
  eventColumns,
  isMissingCityColumnError,
} from './privilegedUrls'

describe('event column tolerance', () => {
  beforeEach(() => {
    resetEventCityColumnCache()
    limit.mockReset()
  })

  it('keeps city off the static selects used before 088', () => {
    expect(EVENT_CATALOG_COLUMNS.split(', ').includes('city')).toBe(false)
    expect(EVENT_PRIVILEGED_COLUMNS.split(', ').includes('city')).toBe(false)
    expect(EVENT_PRIVILEGED_COLUMNS).toContain('zoom_url')
    expect(EVENT_PRIVILEGED_COLUMNS).toContain('recording_url')
  })

  it('appends city only when the column is present', () => {
    const base = 'id, title, image_url'
    expect(eventColumns(base, false)).toBe('id, title, image_url')
    expect(eventColumns(`${base}, city`, false)).toBe('id, title, image_url')
    expect(eventColumns(base, true)).toBe('id, title, image_url, city')
    expect(eventColumns(`${base}, city`, true)).toBe('id, title, image_url, city')
  })

  it('defaults a missing city to null', () => {
    expect(eventCityFromRow(undefined)).toBeNull()
    expect(eventCityFromRow({})).toBeNull()
    expect(eventCityFromRow({ city: null })).toBeNull()
    expect(eventCityFromRow({ city: 'Las Vegas' })).toBe('Las Vegas')
  })

  it('recognises a missing events.city column', () => {
    expect(isMissingCityColumnError(null)).toBe(false)
    expect(isMissingCityColumnError({ code: '42703', message: 'column events.city does not exist' })).toBe(true)
    expect(isMissingCityColumnError({
      code: 'PGRST204',
      message: "Could not find the 'city' column of 'events' in the schema cache",
    })).toBe(true)
    expect(isMissingCityColumnError({ code: '42703', message: 'column events.zoom_url does not exist' })).toBe(false)
    expect(isMissingCityColumnError({ code: '08000', message: 'connection failed' })).toBe(false)
  })

  it('omits city when the probe says the column is missing, and caches that', async () => {
    limit.mockResolvedValue({
      error: { code: '42703', message: 'column events.city does not exist' },
    })
    expect(await eventsHaveCityColumn()).toBe(false)
    expect(await eventsHaveCityColumn()).toBe(false)
    expect(limit).toHaveBeenCalledTimes(1)
  })

  it('selects city once the probe succeeds, and keeps that for the process', async () => {
    limit.mockResolvedValue({ error: null })
    expect(await eventsHaveCityColumn()).toBe(true)
    limit.mockResolvedValue({
      error: { code: '42703', message: 'column events.city does not exist' },
    })
    expect(await eventsHaveCityColumn()).toBe(true)
    expect(limit).toHaveBeenCalledTimes(1)
  })

  it('rechecks a missing column after the ttl so 088 starts returning city', async () => {
    limit.mockResolvedValue({
      error: { code: 'PGRST204', message: "Could not find the 'city' column of 'events' in the schema cache" },
    })
    expect(await eventsHaveCityColumn(1_000)).toBe(false)
    expect(await eventsHaveCityColumn(1_000 + EVENT_CITY_COLUMN_MISS_TTL_MS - 1)).toBe(false)
    expect(limit).toHaveBeenCalledTimes(1)

    limit.mockResolvedValue({ error: null })
    expect(await eventsHaveCityColumn(1_000 + EVENT_CITY_COLUMN_MISS_TTL_MS)).toBe(true)
    expect(limit).toHaveBeenCalledTimes(2)
  })

  it('does not cache a transient probe failure', async () => {
    limit.mockResolvedValueOnce({ error: { code: '08000', message: 'connection failed' } })
    limit.mockResolvedValueOnce({ error: null })
    expect(await eventsHaveCityColumn()).toBe(false)
    expect(await eventsHaveCityColumn()).toBe(true)
    expect(limit).toHaveBeenCalledTimes(2)
  })
})
