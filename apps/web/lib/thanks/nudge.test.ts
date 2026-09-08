import { describe, expect, it } from 'vitest'
import { planThanksNudgeSweep } from './nudge'

const created = '2026-09-07T12:00:00.000Z'

describe('planThanksNudgeSweep', () => {
  it('queues due E02 as pending_approval and never marks a send', () => {
    const plan = planThanksNudgeSweep(
      [
        {
          id: 'inv-1',
          status: 'sent',
          cadence_step: 0,
          created_at: created,
          expires_at: '2026-12-06T12:00:00.000Z',
          next_send_at: '2026-09-10T12:00:00.000Z',
          redeemed_at: null,
        },
      ],
      new Set(),
      new Date('2026-09-10T13:00:00.000Z'),
    )
    expect(plan.enqueue).toEqual([
      {
        invite_id: 'inv-1',
        cadence_step: 1,
        due_at: '2026-09-10T13:00:00.000Z',
        status: 'pending_approval',
      },
    ])
    expect(plan.expireIds).toEqual([])
  })

  it('stops after redeem and after E12, and expires at 90 days', () => {
    const redeemed = planThanksNudgeSweep(
      [
        {
          id: 'inv-r',
          status: 'redeemed',
          cadence_step: 1,
          created_at: created,
          expires_at: '2026-12-06T12:00:00.000Z',
          next_send_at: '2026-09-13T12:00:00.000Z',
          redeemed_at: '2026-09-10T12:00:00.000Z',
        },
      ],
      new Set(),
      new Date('2026-09-13T12:00:00.000Z'),
    )
    expect(redeemed.enqueue).toEqual([])

    const afterE12 = planThanksNudgeSweep(
      [
        {
          id: 'inv-12',
          status: 'sent',
          cadence_step: 11,
          created_at: created,
          expires_at: '2026-12-06T12:00:00.000Z',
          next_send_at: null,
          redeemed_at: null,
        },
      ],
      new Set(),
      new Date('2026-11-10T12:00:00.000Z'),
    )
    expect(afterE12.enqueue).toEqual([])

    const expired = planThanksNudgeSweep(
      [
        {
          id: 'inv-x',
          status: 'sent',
          cadence_step: 8,
          created_at: created,
          expires_at: '2026-12-06T12:00:00.000Z',
          next_send_at: '2026-10-12T12:00:00.000Z',
          redeemed_at: null,
        },
      ],
      new Set(),
      new Date('2026-12-07T12:00:00.000Z'),
    )
    expect(expired.enqueue).toEqual([])
    expect(expired.expireIds).toEqual(['inv-x'])
  })

  it('does not duplicate an already queued step', () => {
    const plan = planThanksNudgeSweep(
      [
        {
          id: 'inv-1',
          status: 'sent',
          cadence_step: 0,
          created_at: created,
          expires_at: '2026-12-06T12:00:00.000Z',
          next_send_at: '2026-09-10T12:00:00.000Z',
          redeemed_at: null,
        },
      ],
      new Set(['inv-1:1']),
      new Date('2026-09-10T13:00:00.000Z'),
    )
    expect(plan.enqueue).toEqual([])
  })
})
