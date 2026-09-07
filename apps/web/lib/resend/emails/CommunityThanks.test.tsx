import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { CommunityThanksEmail } from './CommunityThanks'
import { THANKS_CADENCE_STEPS } from '@/lib/thanks/constants'

const CLAIM = 'https://www.evolvedpros.com/invite/thanks?token=abc'

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
})
