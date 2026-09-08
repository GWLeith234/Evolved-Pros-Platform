import { describe, expect, it } from 'vitest'
import {
  dueCadenceStep,
  explicitYes,
  nextSendAtAfter,
  nextStepAfter,
  shouldStopCadence,
  thanksExpiresAt,
} from './cadence'

const created = new Date('2026-09-07T12:00:00.000Z')

describe('cadence math', () => {
  it('expires 90 days from create', () => {
    expect(thanksExpiresAt(created).toISOString()).toBe('2026-12-06T12:00:00.000Z')
  })

  it('advances 0-11 on the 12-step day map and stops after E12', () => {
    expect(nextStepAfter(0)).toBe(1)
    expect(nextStepAfter(1)).toBe(2)
    expect(nextStepAfter(10)).toBe(11)
    expect(nextStepAfter(11)).toBeNull()
    expect(nextSendAtAfter(created, 0)?.toISOString()).toBe('2026-09-10T12:00:00.000Z')
    expect(nextSendAtAfter(created, 8)?.toISOString()).toBe('2026-10-12T12:00:00.000Z')
    expect(nextSendAtAfter(created, 11)).toBeNull()
  })

  it('treats lastSentStep 0 as a real E01 send, not missing', () => {
    expect(
      dueCadenceStep({
        createdAt: created,
        lastSentStep: 0,
        now: new Date('2026-09-07T12:00:00.000Z'),
        redeemed: false,
        expiresAt: thanksExpiresAt(created),
        status: 'sent',
      }),
    ).toBeNull()
    expect(
      dueCadenceStep({
        createdAt: created,
        lastSentStep: 0,
        now: new Date('2026-09-10T12:00:00.000Z'),
        redeemed: false,
        expiresAt: thanksExpiresAt(created),
        status: 'sent',
      }),
    ).toBe(1)
  })

  it('stops on redeem, expiry, or after E12', () => {
    expect(
      shouldStopCadence({
        redeemed: true,
        lastSentStep: 0,
        now: created,
        expiresAt: thanksExpiresAt(created),
      }),
    ).toEqual({ stop: true, reason: 'redeemed' })
    expect(
      shouldStopCadence({
        redeemed: false,
        lastSentStep: 11,
        now: created,
        expiresAt: thanksExpiresAt(created),
      }),
    ).toEqual({ stop: true, reason: 'cadence_complete' })
    expect(
      shouldStopCadence({
        redeemed: false,
        lastSentStep: 8,
        now: new Date('2026-12-07T12:00:00.000Z'),
        expiresAt: thanksExpiresAt(created),
      }),
    ).toEqual({ stop: true, reason: 'expired' })
  })

  it('returns the next due step and nothing after E12', () => {
    expect(
      dueCadenceStep({
        createdAt: created,
        lastSentStep: 0,
        now: new Date('2026-09-10T12:00:00.000Z'),
        redeemed: false,
        expiresAt: thanksExpiresAt(created),
        status: 'sent',
      }),
    ).toBe(1)
    expect(
      dueCadenceStep({
        createdAt: created,
        lastSentStep: 11,
        now: new Date('2026-11-10T12:00:00.000Z'),
        redeemed: false,
        expiresAt: thanksExpiresAt(created),
        status: 'sent',
      }),
    ).toBeNull()
    expect(
      dueCadenceStep({
        createdAt: created,
        lastSentStep: 1,
        now: new Date('2026-09-10T12:00:00.000Z'),
        redeemed: true,
        expiresAt: thanksExpiresAt(created),
        status: 'redeemed',
      }),
    ).toBeNull()
  })

  it('requires an explicit YES', () => {
    expect(explicitYes(true)).toBe(true)
    expect(explicitYes('YES')).toBe(true)
    expect(explicitYes('yes')).toBe(true)
    expect(explicitYes(false)).toBe(false)
    expect(explicitYes('ok')).toBe(false)
    expect(explicitYes(undefined)).toBe(false)
  })
})
