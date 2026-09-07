import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CommunityThanksEmail } from './CommunityThanks'
import { THANKS_CADENCE_STEPS } from '@/lib/thanks/constants'

const CLAIM = 'https://www.evolvedpros.com/invite/thanks?token=abc'
const root = resolve(__dirname, '../../..')

function src(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8')
}

/** Magic Link bar: red middle interpunct, never a period. */
const WORDMARK = "EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS"

describe('CommunityThanksEmail', () => {
  it('renders each cadence with www claim URL, signoff, and no pitch', () => {
    for (const step of THANKS_CADENCE_STEPS) {
      const html = renderToStaticMarkup(
        <CommunityThanksEmail
          step={step}
          first_name="Ada"
          claim_url={CLAIM}
          george_signoff="George"
        />,
      )
      expect(html).toContain(CLAIM)
      expect(html).toContain('Ada')
      expect(html).toContain('George')
      expect(html).toContain(`ep-community-thanks-${step}`)
      expect(html).not.toContain('\u2014')
      expect(html.toLowerCase()).not.toMatch(/vip|professional|upgrade|stripe|mastermind/)
      expect(html).not.toContain('/welcome')
      expect(html).not.toContain('FRIENDSOFGEORGE')
    }
  })

  it('ships the Magic Link EVOLVED·PROS wordmark in header and footer on every step', () => {
    const magic = src('lib/resend/emails/MagicLink.tsx')
    const thanks = src('lib/resend/emails/CommunityThanks.tsx')
    expect(magic).toContain(WORDMARK)
    expect(thanks).toContain(WORDMARK)
    expect(thanks.split(WORDMARK).length - 1).toBeGreaterThanOrEqual(1)
    expect(thanks).toContain('{EP_EMAIL_WORDMARK}')
    expect(thanks.split('{EP_EMAIL_WORDMARK}').length - 1).toBeGreaterThanOrEqual(2)
    expect(thanks).not.toContain("'>.</span>PROS")
    expect(thanks).not.toMatch(/EVOLVED<span[^>]*>\.<\/span>PROS/)

    for (const step of THANKS_CADENCE_STEPS) {
      const html = renderToStaticMarkup(
        <CommunityThanksEmail
          step={step}
          first_name="Ada"
          claim_url={CLAIM}
          george_signoff="George"
        />,
      )
      expect(html).toContain('EVOLVED')
      expect(html).toContain('PROS')
      expect(html).toContain('·')
      expect(html).toContain('#ef0e30')
      const marks = html.match(/EVOLVED[\s\S]*?·[\s\S]*?PROS/g) ?? []
      expect(marks.length, `step ${step} missing header+footer wordmark`).toBeGreaterThanOrEqual(2)
      expect(html).not.toMatch(/EVOLVED<span[^>]*>\.<\/span>PROS/)
    }
  })
})
