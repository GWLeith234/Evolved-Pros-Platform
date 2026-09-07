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

  it('only advances D0 -> D7 -> D14 -> D28', () => {
    expect(nextStepAfter('d0')).toBe('d7')
    expect(nextStepAfter('d7')).toBe('d14')
    expect(nextStepAfter('d14')).toBe('d28')
    expect(nextStepAfter('d28')).toBeNull()
    expect(nextSendAtAfter(created, 'd0')?.toISOString()).toBe('2026-09-14T12:00:00.000Z')
    expect(nextSendAtAfter(created, 'd28')).toBeNull()
  })

  it('stops on redeem, expiry, or after D28', () => {
    expect(
      shouldStopCadence({
        redeemed: true,
        lastSentStep: 'd0',
        now: created,
        expiresAt: thanksExpiresAt(created),
      }),
    ).toEqual({ stop: true, reason: 'redeemed' })
    expect(
      shouldStopCadence({
        redeemed: false,
        lastSentStep: 'd28',
        now: created,
        expiresAt: thanksExpiresAt(created),
      }),
    ).toEqual({ stop: true, reason: 'cadence_complete' })
    expect(
      shouldStopCadence({
        redeemed: false,
        lastSentStep: 'd14',
        now: new Date('2026-12-07T12:00:00.000Z'),
        expiresAt: thanksExpiresAt(created),
      }),
    ).toEqual({ stop: true, reason: 'expired' })
  })

  it('returns the next due step and nothing after D28', () => {
    expect(
      dueCadenceStep({
        createdAt: created,
        lastSentStep: 'd0',
        now: new Date('2026-09-14T12:00:00.000Z'),
        redeemed: false,
        expiresAt: thanksExpiresAt(created),
        status: 'sent',
      }),
    ).toBe('d7')
    expect(
      dueCadenceStep({
        createdAt: created,
        lastSentStep: 'd28',
        now: new Date('2026-10-10T12:00:00.000Z'),
        redeemed: false,
        expiresAt: thanksExpiresAt(created),
        status: 'sent',
      }),
    ).toBeNull()
    expect(
      dueCadenceStep({
        createdAt: created,
        lastSentStep: 'd7',
        now: new Date('2026-09-14T12:00:00.000Z'),
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
