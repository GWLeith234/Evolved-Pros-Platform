import { describe, expect, it } from 'vitest'
import {
  GOVERNING_LAW_AND_VENUE,
  GOVERNING_LAW_SENTENCE,
  GOVERNING_VENUE_SENTENCE,
  LEGAL_ENTITY_NAME,
  MEMBERSHIP_REFUND_PARAS,
  REGISTERED_OFFICE_CARE_OF,
  REGISTERED_OFFICE_LINES,
} from './legalCopy'

const refunds = MEMBERSHIP_REFUND_PARAS.join(' ')

describe('registered office', () => {
  it('names the contracting entity and counsel firm, then the published Saskatoon address', () => {
    expect(REGISTERED_OFFICE_LINES).toEqual([
      'GWLeith Revenue Growth Solutions',
      'c/o MacDermid Lamarsh',
      '216 1st Avenue South, 3rd Floor',
      'Saskatoon, Saskatchewan  S7K 1K3',
      'Canada',
    ])
    expect(LEGAL_ENTITY_NAME).toBe('GWLeith Revenue Growth Solutions')
    expect(REGISTERED_OFFICE_CARE_OF).toBe('MacDermid Lamarsh')
  })

  it('does not publish a home address, a stale Toronto/Calgary office, or the misspelled firm name', () => {
    const block = REGISTERED_OFFICE_LINES.join('\n')
    for (const wrong of [
      'AdCellerant',
      '199 Bay',
      'Calgary',
      '234 Bornstein',
      '301 3rd',
      'MacDirmid',
      "George's lawyer",
      'TODO GEORGE / COUNSEL',
    ]) {
      expect(block).not.toContain(wrong)
    }
  })
})

describe('governing law and venue', () => {
  it('is Saskatchewan law and Saskatchewan courts — the locked sentences, nothing more', () => {
    expect(GOVERNING_LAW_SENTENCE).toBe(
      'These terms are governed by the laws of the Province of Saskatchewan, Canada.',
    )
    expect(GOVERNING_VENUE_SENTENCE).toBe('Venue: courts of Saskatchewan.')
    expect(GOVERNING_LAW_AND_VENUE).toBe(
      'These terms are governed by the laws of the Province of Saskatchewan, Canada. Venue: courts of Saskatchewan.',
    )
  })
})

describe('membership refunds and cancellation', () => {
  it('covers cancel-anytime and no refunds of the prepaid period', () => {
    expect(refunds).toContain('cancel a paid membership')
    expect(refunds).toContain('VIP, Professional, or any other recurring platform plan')
    expect(refunds).toContain('Cancellation stops renewal')
    expect(refunds).toContain('end of the period already paid')
    expect(refunds).toContain('do not refund membership payments')
    expect(refunds).toContain('including the current period')
  })

  it('has no 7-day first-charge refund and no Consumer Protection essay', () => {
    expect(refunds).not.toContain('First paid charge only')
    expect(refunds).not.toContain('within 7 days of that first charge')
    expect(refunds).not.toContain('refund that charge in full and revoke access')
    expect(refunds).not.toContain('7-day first-charge')
    expect(refunds).not.toContain('7-day window')
    expect(refunds).not.toContain('The Consumer Protection and Business Practices Act')
    expect(refunds).not.toContain('7 days after receiving a copy')
    expect(refunds).not.toContain('30 days after entering the contract')
    expect(refunds).not.toContain('within 15 days of a valid statutory cancellation')
    expect(refunds).not.toContain('This is not a blanket cooling-off period')
  })

  it('keeps one Saskatchewan statutory-rights sentence and rejects all-sales-final / counsel TODOs', () => {
    expect(refunds).toContain(
      'Nothing in these terms takes away rights that Saskatchewan law does not let a supplier waive',
    )
    expect(refunds.toLowerCase()).not.toContain('all sales final')
    expect(refunds).not.toContain('TODO GEORGE / COUNSEL')
  })

  it('routes requests to support@evolvedpros.com and names Stripe', () => {
    expect(refunds).toContain('support@evolvedpros.com')
    expect(refunds).toContain('Stripe')
  })

  it('puts keynotes and LIVE out of scope without inventing a ticket policy', () => {
    expect(MEMBERSHIP_REFUND_PARAS[MEMBERSHIP_REFUND_PARAS.length - 1]).toBe(
      'Keynotes and LIVE events have their own terms, provided at booking.',
    )
    expect(refunds.toLowerCase()).not.toContain('restocking')
    expect(refunds.toLowerCase()).not.toContain('14-day')
    expect(refunds.toLowerCase()).not.toContain('academy')
    expect(refunds.toLowerCase()).not.toContain('deposit')
  })
})
