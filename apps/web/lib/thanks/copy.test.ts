import { describe, expect, it } from 'vitest'
import { THANKS_CADENCE_STEPS, THANKS_TEMPLATE_IDS } from './constants'
import {
  assertThanksCopyClean,
  buildThanksEmailCopy,
  stripPreviewSubjectPrefix,
  thanksCopyViolations,
} from './copy'

const CLAIM = 'https://www.evolvedpros.com/invite/thanks?token=abc'

const SUBJECTS: Record<number, string> = {
  0: "You've been in my corner",
  1: 'Foundation: start with the basics',
  2: 'Identity: stand for something',
  3: 'Mental Toughness: ritual over mood',
  4: 'Strategy: decide where attention goes',
  5: 'Accountability: pipeline is not a wish list',
  6: 'Execution: make the next call better',
  7: 'How the six pillars fit together',
  8: 'If you want to go deeper',
  9: 'LIVE and the AI conversation',
  10: 'EVOLVED on Amazon Oct 15',
  11: 'Last note from me on this',
}

describe('thank-you email copy', () => {
  it('fills first_name, claim_url, and george_signoff on every step', () => {
    for (const step of THANKS_CADENCE_STEPS) {
      const copy = buildThanksEmailCopy(step, {
        first_name: 'Ada',
        claim_url: CLAIM,
        george_signoff: 'George',
      })
      expect(copy.templateId).toBe(THANKS_TEMPLATE_IDS[step])
      expect(copy.subject).toBe(SUBJECTS[step])
      expect(copy.vars).toEqual({
        first_name: 'Ada',
        claim_url: CLAIM,
        george_signoff: 'George',
      })
      expect(copy.paragraphs.join(' ')).toContain('Ada')
      expect(assertThanksCopyClean(copy)).toEqual([])
    }
  })

  it('strips a PREVIEW v12 subject prefix for production', () => {
    expect(stripPreviewSubjectPrefix('[PREVIEW 2026-09-07 v12] You\'ve been in my corner')).toBe(
      "You've been in my corner",
    )
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
