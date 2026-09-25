import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  adEventWriteOutcome,
  isMissingAdEventsTable,
  resetAdEventsMissingLog,
} from './adEvents'

describe('ad_events ingest when migration 082 is not applied', () => {
  beforeEach(() => {
    resetAdEventsMissingLog()
    vi.restoreAllMocks()
  })

  it('treats a missing table as a missing table', () => {
    expect(isMissingAdEventsTable(null)).toBe(false)
    expect(isMissingAdEventsTable({ code: '42P01', message: 'relation "ad_events" does not exist' })).toBe(true)
    expect(isMissingAdEventsTable({
      code: 'PGRST205',
      message: "Could not find the table 'public.ad_events' in the schema cache",
    })).toBe(true)
    expect(isMissingAdEventsTable({
      message: 'relation "public.ad_events" does not exist',
    })).toBe(true)
    expect(isMissingAdEventsTable({ code: '23502', message: 'null value in column "ad_id"' })).toBe(false)
    expect(isMissingAdEventsTable({ code: '42501', message: 'permission denied for table ad_events' })).toBe(false)
  })

  it('returns 201 when the insert succeeds', () => {
    expect(adEventWriteOutcome(null)).toEqual({ status: 201, body: { ok: true } })
  })

  it('returns 204 and logs once when the table is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const missing = { code: '42P01', message: 'relation "ad_events" does not exist' }
    expect(adEventWriteOutcome(missing)).toEqual({ status: 204, body: null })
    expect(adEventWriteOutcome({ code: 'PGRST205', message: 'schema cache' })).toEqual({ status: 204, body: null })
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('still returns 500 for any other insert error', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(adEventWriteOutcome({ code: '23502', message: 'null value' })).toEqual({
      status: 500,
      body: { error: 'Failed to record event' },
    })
    expect(warn).not.toHaveBeenCalled()
  })
})
