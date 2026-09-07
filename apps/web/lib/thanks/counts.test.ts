import { describe, expect, it } from 'vitest'
import { computeThanksCounts } from './counts'

describe('computeThanksCounts', () => {
  it('counts invited, delivered, redeemed, stopped, expired', () => {
    const counts = computeThanksCounts([
      { status: 'sent', delivered_count: 1 },
      { status: 'redeemed', delivered_count: 2 },
      { status: 'stopped' },
      { status: 'expired' },
      { status: 'pending' },
    ])
    expect(counts.invited).toBe(5)
    expect(counts.delivered).toBe(2)
    expect(counts.redeemed).toBe(1)
    expect(counts.stopped).toBe(1)
    expect(counts.expired).toBe(1)
    expect(counts.opens).toBeNull()
    expect(counts.opensAvailable).toBe(false)
  })

  it('exposes opens only when a webhook recorded one', () => {
    const counts = computeThanksCounts(
      [{ status: 'sent', delivered_count: 1, opened_at: '2026-09-08T12:00:00.000Z' }],
      [{ status: 'sent', opened_at: '2026-09-08T12:00:00.000Z' }],
    )
    expect(counts.opensAvailable).toBe(true)
    expect(counts.opens).toBe(2)
  })
})
