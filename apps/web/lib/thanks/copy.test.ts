import { describe, expect, it } from 'vitest'
import { THANKS_CADENCE_STEPS } from './constants'
import { assertThanksCopyClean, buildThanksEmailCopy, thanksCopyViolations } from './copy'

const CLAIM = 'https://www.evolvedpros.com/invite/thanks?token=abc'

describe('thank-you email copy', () => {
  it('fills first_name, claim_url, and george_signoff on every step', () => {
    for (const step of THANKS_CADENCE_STEPS) {
      const copy = buildThanksEmailCopy(step, {
        first_name: 'Ada',
        claim_url: CLAIM,
        george_signoff: 'George',
      })
      expect(copy.templateId).toBe(`ep-community-thanks-${step}`)
      expect(copy.vars).toEqual({
        first_name: 'Ada',
        claim_url: CLAIM,
        george_signoff: 'George',
      })
      expect(copy.paragraphs.join(' ')).toContain('Ada')
      expect(assertThanksCopyClean(copy)).toEqual([])
    }
  })

  it('has no em dashes and no VIP/Pro pitch', () => {
    for (const step of THANKS_CADENCE_STEPS) {
      const copy = buildThanksEmailCopy(step, { first_name: 'Sam', claim_url: CLAIM })
      const blob = [copy.subject, copy.preview, copy.cta, ...copy.paragraphs].join('\n')
      expect(thanksCopyViolations(blob)).toEqual([])
      expect(blob.toLowerCase()).not.toMatch(/vip|pro|professional|upgrade|stripe|mastermind/)
      expect(blob).not.toContain('\u2014')
      expect(blob).not.toContain('/welcome')
      expect(blob).not.toContain('FRIENDSOFGEORGE')
    }
  })
})
