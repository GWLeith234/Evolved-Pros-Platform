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
const WORDMARK = 'EVOLVED<span style="color:#ef0e30;">·</span>PROS'

const FIXTURE = `<!doctype html>
<html>
<body>
  <p>${WORDMARK}</p>
  <p>Hi {{first_name}},</p>
  <a href="{{claim_url}}">Claim free Community</a>
  <p>Copy this link: <a href="{{claim_url}}">{{claim_url}}</a></p>
  <a href="${PODCAST}">Carson Teagarden podcast</a>
  <img src="cid:george-headshot" alt="George" />
</body>
</html>`

describe('send-ready-v13 HTML wiring', () => {
  it('maps all 12 steps onto eNN-dDD filenames', () => {
    expect(THANKS_V12_HTML_FILES[0]).toBe('e01-d00.html')
    expect(THANKS_V12_HTML_FILES[1]).toBe('e02-d03.html')
    expect(THANKS_CADENCE_STEPS.every(step => THANKS_V12_HTML_FILES[step])).toBe(true)
  })

  it('substitutes first_name and claim_url and never rewrites /podcast or /media', () => {
    const html = applyThanksV12Vars(FIXTURE, { first_name: 'Ada', claim_url: CLAIM })
    expect(html).toContain('Hi Ada,')
    expect(html).not.toContain('{{first_name}}')
    expect(html).toContain(`href="${CLAIM}"`)
    expect(html).toContain(`>${CLAIM}</a>`)
    expect(html).toContain(`href="${PODCAST}"`)
    expect(html).not.toContain(`${CLAIM}/podcast`)
    expect(html).toContain('cid:george-headshot')
    expect(html).not.toContain('cid:logo')
  })

  it('escapes first_name so markup cannot land in the greeting', () => {
    const sneaky = '<b>Ada</b>'
    const html = applyThanksV12Vars(`Hello {{first_name}} ${WORDMARK}`, {
      first_name: sneaky,
      claim_url: CLAIM,
    })
    expect(html).toContain(`Hello ${escapeThanksHtml(sneaky)}`)
    expect(html).not.toContain('<b>')
  })

  it('refuses {{George}}, {{{{first_name}}}}, and cid:logo', () => {
    expect(() => applyThanksV12Vars('Hey {{George}},', { first_name: 'Ada', claim_url: CLAIM })).toThrow(/first_name/)
    expect(() => applyThanksV12Vars('Hey {{{{first_name}}}},', { first_name: 'Ada', claim_url: CLAIM })).toThrow(/first_name/)
    expect(() => applyThanksV12Vars('<img src="cid:logo">', { first_name: 'Ada', claim_url: CLAIM })).toThrow(/cid:logo/)
  })

  it('lands E01 v13 with text wordmark, {{first_name}}, and claim_url tokens', () => {
    const raw = loadThanksV12Html(0)
    expect(raw).toBeTruthy()
    expect(raw).toContain("You've been in my corner")
    expect(raw).toContain('Hey {{first_name}},')
    expect(raw).not.toContain('{{George}}')
    expect(raw).not.toContain('{{{{first_name}}}}')
    expect(raw).toContain(WORDMARK)
    expect(raw).not.toContain('cid:logo')
    expect(raw).toContain('cid:george-headshot')
    expect(raw).toContain('href="{{claim_url}}"')
    expect(raw).toContain('https://www.evolvedpros.com/media/identity/why-i-created-evolved-pros')
    expect(raw).toContain('https://www.evolvedpros.com/podcast/evolved-pros-pilot-episode')

    const html = renderThanksV12Html(0, { first_name: 'Ada', claim_url: CLAIM })
    expect(html).toContain('Hey Ada,')
    expect(html).not.toContain('{{first_name}}')
    expect(html).toContain(`href="${CLAIM}"`)
    expect(html).toContain(`>${CLAIM}</a>`)
    expect(html).not.toMatch(/href=["']https:\/\/www\.evolvedpros\.com\/["']/)
    expect(html).toContain('https://www.evolvedpros.com/media/identity/why-i-created-evolved-pros')
    expect(html).toContain('https://www.evolvedpros.com/podcast/evolved-pros-pilot-episode')
    expect(html).not.toContain(`${CLAIM}/media`)
    expect(html).not.toContain(`${CLAIM}/podcast`)
    expect(html).toContain(WORDMARK)
    expect(html).toContain('cid:george-headshot')
    expect(html).toContain('>George<')
  })

  it('lands E02 v13 with the same wordmark and first_name lock', () => {
    const raw = loadThanksV12Html(1)
    expect(raw).toBeTruthy()
    expect(raw).toContain('Start with the basics.')
    expect(raw).toContain('Hey {{first_name}},')
    expect(raw).toContain(WORDMARK)
    expect(raw).not.toContain('cid:logo')
    expect(raw).toContain('cid:george-headshot')
    expect(raw).toContain('https://www.evolvedpros.com/media/foundation/hard-boiled-eggs-protein-snack-hack')
    expect(raw).toContain('https://www.evolvedpros.com/podcast/fitness-nutrition-evolved-pros-carson-teagarden')

    const html = renderThanksV12Html(1, { first_name: 'Ada', claim_url: CLAIM })
    expect(html).toContain('Hey Ada,')
    expect(html).toContain(`href="${CLAIM}"`)
    expect(html).not.toContain(`${CLAIM}/media`)
    expect(html).not.toContain(`${CLAIM}/podcast`)
    expect(html).toContain('https://www.evolvedpros.com/media/foundation/hard-boiled-eggs-protein-snack-hack')
  })

  it('lands E03 with Identity locks and absolute Tecovas / Dennis Yu hrefs', () => {
    const raw = loadThanksV12Html(2)
    expect(raw).toBeTruthy()
    expect(raw).toContain('Stand for something.')
    expect(raw).toContain('Hey {{first_name}},')
    expect(raw).toContain(WORDMARK)
    expect(raw).not.toContain('cid:logo')
    expect(raw).toContain('cid:george-headshot')
    expect(raw).toContain('https://www.evolvedpros.com/media/identity/tecovas-denver')
    expect(raw).toContain('https://www.evolvedpros.com/podcast/dennis-yu-authority-content')
    const html = renderThanksV12Html(2, { first_name: 'Ada', claim_url: CLAIM })
    expect(html).toContain('Hey Ada,')
    expect(html).toContain(`href="${CLAIM}"`)
    expect(html).not.toContain(`${CLAIM}/media`)
    expect(html).not.toContain(`${CLAIM}/podcast`)
  })

  it('keeps every landed file Gmail-safe: tables, inline styles, text wordmark, no cid:logo', () => {
    const landed = landedThanksV12Steps()
    expect(landed).toEqual(expect.arrayContaining([0, 1, 2]))
    for (const step of landed) {
      const raw = loadThanksV12Html(step)
      expect(thanksV12GmailSafeViolations(raw!), THANKS_V12_HTML_FILES[step]).toEqual([])
    }
  })

  it('leaves path-bearing www links alone', () => {
    const html = applyThanksV12Vars(
      `<p>${WORDMARK}</p><a href="${PODCAST}">pod</a><a href="https://www.evolvedpros.com/invite/thanks">claim page</a><img src="cid:george-headshot" />`,
      { first_name: 'Ada', claim_url: CLAIM },
    )
    expect(html).toContain(`href="${PODCAST}"`)
    expect(html).toContain('href="https://www.evolvedpros.com/invite/thanks"')
  })
})
