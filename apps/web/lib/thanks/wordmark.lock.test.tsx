import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EpWordmark } from '@/components/brand/EpWordmark'
import { CommunityThanksEmail } from '@/lib/resend/emails/CommunityThanks'
import { THANKS_CADENCE_STEPS } from './constants'

const root = resolve(__dirname, '../..')

function src(rel: string) {
  return readFileSync(resolve(root, rel), 'utf8')
}

const MAGIC_SPAN = "EVOLVED<span style={{ color: '#ef0e30' }}>·</span>PROS"
const PERIOD_SPAN = /EVOLVED<span[^>]*>\.<\/span>PROS/
const PLAIN_LOCKUPS = ['EVOLVED PROS', 'EVOLVED.PROS']

const FEATURE_CHROME = [
  'components/brand/EpWordmark.tsx',
  'lib/resend/emails/CommunityThanks.tsx',
  'app/invite/thanks/page.tsx',
  'app/(admin)/admin/thanks/page.tsx',
]

describe('standing mandate: EVOLVED·PROS wordmark on every thanks surface', () => {
  it('matches the Magic Link span (red ·) and never a period or plain lockup', () => {
    expect(src('lib/resend/emails/MagicLink.tsx')).toContain(MAGIC_SPAN)
    const mark = src('components/brand/EpWordmark.tsx')
    expect(mark).toContain(MAGIC_SPAN)
    expect(mark).toContain("data-testid=\"ep-wordmark\"")
    expect(mark).not.toMatch(PERIOD_SPAN)
    for (const plain of PLAIN_LOCKUPS) {
      expect(mark).not.toContain(plain)
    }
  })

  it('is wired into emails, claim page, and admin chrome', () => {
    expect(src('lib/resend/emails/CommunityThanks.tsx')).toContain('<EpWordmarkMark')
    expect(src('app/invite/thanks/page.tsx')).toContain('<EpWordmark')
    expect(src('app/(admin)/admin/thanks/page.tsx')).toContain('<EpWordmark')
    for (const file of FEATURE_CHROME) {
      const text = src(file)
      expect(text, file).not.toMatch(PERIOD_SPAN)
    }
  })

  it('renders the red interpunct wordmark for UI and every cadence template', () => {
    const ui = renderToStaticMarkup(<EpWordmark tone="light" />)
    expect(ui).toContain('data-testid="ep-wordmark"')
    expect(ui).toContain('EVOLVED')
    expect(ui).toContain('PROS')
    expect(ui).toContain('·')
    expect(ui).toContain('#ef0e30')
    expect(ui).not.toMatch(PERIOD_SPAN)

    for (const step of THANKS_CADENCE_STEPS) {
      const html = renderToStaticMarkup(
        <CommunityThanksEmail
          step={step}
          first_name="Ada"
          claim_url="https://www.evolvedpros.com/invite/thanks?token=abc"
          george_signoff="George"
        />,
      )
      const marks = html.match(/EVOLVED[\s\S]*?·[\s\S]*?PROS/g) ?? []
      expect(marks.length, `d${step} missing header+footer wordmark`).toBeGreaterThanOrEqual(2)
      expect(html).toContain('#ef0e30')
      expect(html).not.toMatch(PERIOD_SPAN)
    }
  })
})
