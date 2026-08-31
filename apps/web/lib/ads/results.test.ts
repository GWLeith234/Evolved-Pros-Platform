import { describe, expect, it } from 'vitest'
import { aggregateAdResults, formatCtr } from './results'

describe('aggregateAdResults', () => {
  it('returns an empty result when there are no events (do not invent numbers)', () => {
    const out = aggregateAdResults([], [
      { id: 'ad-1', image_url: '/ads/academy-300x250.png', headline: 'Academy', sponsor_name: null, tool_name: null },
    ])
    expect(out.rows).toEqual([])
    expect(out.totals).toEqual({ impressions: 0, clicks: 0, ctr: null })
    expect(out.asOf).toBeNull()
    expect(formatCtr(out.totals.ctr)).toBe('—')
  })

  it('breaks out impressions, clicks, CTR, and last click by creative + slot', () => {
    const out = aggregateAdResults(
      [
        { ad_id: 'ad-1', event_type: 'impression', creative_name: 'Build the system.', creative_slot: '300x250', created_at: '2026-08-31T10:00:00.000Z' },
        { ad_id: 'ad-1', event_type: 'impression', creative_name: 'Build the system.', creative_slot: '300x250', created_at: '2026-08-31T10:01:00.000Z' },
        { ad_id: 'ad-1', event_type: 'click', creative_name: 'Build the system.', creative_slot: '300x250', created_at: '2026-08-31T10:02:00.000Z' },
        { ad_id: 'ad-1', event_type: 'impression', creative_name: 'Build the system.', creative_slot: '300x600', created_at: '2026-08-31T11:00:00.000Z' },
        { ad_id: 'ad-2', event_type: 'impression', creative_name: 'Leaderboard', creative_slot: '728x90', created_at: '2026-08-31T09:00:00.000Z' },
      ],
      [
        { id: 'ad-1', image_url: '/ads/academy-300x250.png', headline: 'Build the system.', sponsor_name: 'Evolved Pros Academy', tool_name: 'Academy' },
      ],
    )

    expect(out.asOf).toBe('2026-08-31T11:00:00.000Z')
    expect(out.totals).toEqual({ impressions: 4, clicks: 1, ctr: 0.25 })
    expect(out.rows).toHaveLength(3)

    const med = out.rows.find(r => r.creativeSlot === '300x250')
    expect(med).toMatchObject({
      adId: 'ad-1',
      impressions: 2,
      clicks: 1,
      ctr: 0.5,
      lastClickAt: '2026-08-31T10:02:00.000Z',
      imageUrl: '/ads/academy-300x250.png',
    })

    const half = out.rows.find(r => r.creativeSlot === '300x600')
    expect(half).toMatchObject({ impressions: 1, clicks: 0, ctr: 0, lastClickAt: null })

    expect(formatCtr(0.5)).toBe('50.0%')
    expect(formatCtr(0)).toBe('0.0%')
  })

  it('ignores unknown slots and event types so junk rows cannot mint metrics', () => {
    const out = aggregateAdResults([
      { ad_id: 'ad-1', event_type: 'impression', creative_name: 'X', creative_slot: '160x600', created_at: '2026-08-31T10:00:00.000Z' },
      { ad_id: 'ad-1', event_type: 'bounce', creative_name: 'X', creative_slot: '300x250', created_at: '2026-08-31T10:00:00.000Z' },
    ])
    expect(out.rows).toEqual([])
    expect(out.asOf).toBeNull()
  })
})
