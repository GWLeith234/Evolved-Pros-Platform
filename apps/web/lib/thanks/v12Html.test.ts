import { describe, expect, it } from 'vitest'
import { THANKS_V12_HTML_FILES } from './v12Html'
import {
  applyThanksV12Vars,
  escapeThanksHtml,
  landedThanksV12Steps,
  loadThanksV12Html,
  renderThanksV12Html,
  thanksV12GmailSafeViolations,
} from './v12Html'
import { THANKS_CADENCE_STEPS } from './constants'

const CLAIM = 'https://www.evolvedpros.com/invite/thanks?token=abc'
const PODCAST = 'https://www.evolvedpros.com/podcast/carson-teagarden'

const FIXTURE = `<!doctype html>
<html>
<body>
  <img src="cid:logo" alt="EVOLVED PROS" />
  <p>Hi {{George}},</p>
  <a href="https://www.evolvedpros.com/" class="cta">Claim free Community</a>
  <p>Copy this link: https://www.evolvedpros.com/</p>
  <a href="${PODCAST}">Carson Teagarden podcast</a>
  <img src="cid:george-headshot" alt="George" />
</body>
</html>`

describe('send-ready-v12 HTML wiring', () => {
  it('maps all 12 steps onto eNN-dDD filenames', () => {
    expect(THANKS_V12_HTML_FILES[0]).toBe('e01-d00.html')
    expect(THANKS_V12_HTML_FILES[1]).toBe('e02-d03.html')
    expect(THANKS_V12_HTML_FILES[2]).toBe('e03-d06.html')
    expect(THANKS_V12_HTML_FILES[3]).toBe('e04-d09.html')
    expect(THANKS_V12_HTML_FILES[11]).toBe('e12-d56.html')
    expect(THANKS_CADENCE_STEPS.every(step => THANKS_V12_HTML_FILES[step])).toBe(true)
  })

  it('substitutes first_name and claim_url and keeps cid attachments', () => {
    const html = applyThanksV12Vars(FIXTURE, { first_name: 'Ada', claim_url: CLAIM })
    expect(html).toContain('Hi Ada,')
    expect(html).not.toContain('{{George}}')
    expect(html).toContain(`href="${CLAIM}"`)
    expect(html).toContain(`Copy this link: ${CLAIM}`)
    expect(html).not.toMatch(/href=["']https:\/\/www\.evolvedpros\.com\/["']/)
    expect(html).toContain(`href="${PODCAST}"`)
    expect(html).toContain('cid:logo')
    expect(html).toContain('cid:george-headshot')
    expect(html).not.toContain('cid:logo-rewritten')
  })

  it('escapes first_name so markup cannot land in the greeting', () => {
    const sneaky = '<b>Ada</b>'
    const html = applyThanksV12Vars('Hello {{George}}', { first_name: sneaky, claim_url: CLAIM })
    expect(html).toBe(`Hello ${escapeThanksHtml(sneaky)}`)
    expect(html).not.toContain('<b>')
  })

  it('lands E01 verbatim and wires claim_url + first_name at send time', () => {
    const raw = loadThanksV12Html(0)
    expect(raw).toBeTruthy()
    expect(raw).toContain("You've been in my corner")
    expect(raw).toContain('Hey {{George}},')
    expect(raw).toContain('cid:logo')
    expect(raw).toContain('cid:george-headshot')
    expect(raw).toContain('href="https://www.evolvedpros.com/"')
    expect(raw).toContain('https://www.evolvedpros.com/media/identity/why-i-created-evolved-pros')
    expect(raw).toContain('https://www.evolvedpros.com/podcast/evolved-pros-pilot-episode')
    expect(raw).toContain('alt="EVOLVED·PROS"')

    const html = renderThanksV12Html(0, { first_name: 'Ada', claim_url: CLAIM })
    expect(html).toContain('Hey Ada,')
    expect(html).not.toContain('{{George}}')
    expect(html).toContain(`href="${CLAIM}"`)
    expect(html).toContain(`>${CLAIM}</a>`)
    expect(html).not.toMatch(/href=["']https:\/\/www\.evolvedpros\.com\/["']/)
    expect(html).toContain('cid:logo')
    expect(html).toContain('cid:george-headshot')
    expect(html).toContain('https://www.evolvedpros.com/media/identity/why-i-created-evolved-pros')
    expect(html).toContain('https://www.evolvedpros.com/podcast/evolved-pros-pilot-episode')
    expect(html).toContain('>George<')
  })

  it('lands E02 verbatim and wires claim_url + first_name at send time', () => {
    const raw = loadThanksV12Html(1)
    expect(raw).toBeTruthy()
    expect(raw).toContain('Start with the basics.')
    expect(raw).toContain('Hey {{George}},')
    expect(raw).toContain('cid:logo')
    expect(raw).toContain('cid:george-headshot')
    expect(raw).toContain('href="https://www.evolvedpros.com/"')
    expect(raw).toContain('https://www.evolvedpros.com/media/foundation/hard-boiled-eggs-protein-snack-hack')
    expect(raw).toContain('https://www.evolvedpros.com/podcast/fitness-nutrition-evolved-pros-carson-teagarden')
    expect(raw).not.toMatch(/\sclass\s*=/i)
    expect(raw).not.toMatch(/<style[\s>]/i)

    const html = renderThanksV12Html(1, { first_name: 'Ada', claim_url: CLAIM })
    expect(html).toContain('Hey Ada,')
    expect(html).not.toContain('{{George}}')
    expect(html).toContain(`href="${CLAIM}"`)
    expect(html).toContain(`>${CLAIM}</a>`)
    expect(html).not.toMatch(/href=["']https:\/\/www\.evolvedpros\.com\/["']/)
    expect(html).toContain('cid:logo')
    expect(html).toContain('cid:george-headshot')
    expect(html).toContain('https://www.evolvedpros.com/media/foundation/hard-boiled-eggs-protein-snack-hack')
    expect(html).toContain('>George<')
  })

  it('keeps every landed v12 file Gmail-safe: tables, inline styles, CID, no classes', () => {
    const landed = landedThanksV12Steps()
    expect(landed).toEqual(expect.arrayContaining([0, 1]))
    for (const step of landed) {
      const raw = loadThanksV12Html(step)
      expect(raw, THANKS_V12_HTML_FILES[step]).toBeTruthy()
      expect(thanksV12GmailSafeViolations(raw!), THANKS_V12_HTML_FILES[step]).toEqual([])
    }
  })

  it('leaves path-bearing www links alone (podcast, invite path)', () => {
    const html = applyThanksV12Vars(
      `<a href="${PODCAST}">pod</a><a href="https://www.evolvedpros.com/invite/thanks">claim page</a>`,
      { first_name: 'Ada', claim_url: CLAIM },
    )
    expect(html).toContain(`href="${PODCAST}"`)
    expect(html).toContain('href="https://www.evolvedpros.com/invite/thanks"')
  })
})
