import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  CampaignFooter,
  DEFAULT_CAMPAIGN_REASON,
  campaignFooterText,
  senderIdentityLines,
} from './CampaignFooter'

const URL_ = 'https://platform.evolvedpros.com/unsubscribe?token=abc.def'
const IDENTITY = 'GWLeith Revenue Growth Solutions | 1 Example St, Saskatoon SK S7K 0A1'

describe('senderIdentityLines', () => {
  it('splits the pipe-separated env value into display lines', () => {
    expect(senderIdentityLines(IDENTITY)).toEqual([
      'GWLeith Revenue Growth Solutions',
      '1 Example St, Saskatoon SK S7K 0A1',
    ])
  })

  it('drops empty segments from a trailing or doubled pipe', () => {
    expect(senderIdentityLines('Name | ')).toEqual(['Name'])
    expect(senderIdentityLines('Name || Addr')).toEqual(['Name', 'Addr'])
  })

  it('handles an identity with no pipe at all', () => {
    expect(senderIdentityLines('Just A Name')).toEqual(['Just A Name'])
  })
})

describe('CampaignFooter — rendered markup', () => {
  const html = renderToStaticMarkup(
    <CampaignFooter unsubscribeUrl={URL_} senderIdentity={IDENTITY} />,
  )

  it('renders the unsubscribe URL as a real href', () => {
    expect(html).toContain(`href="${URL_}"`)
    expect(html).toContain('Unsubscribe')
  })

  it('renders both CASL identity lines — business name and mailing address', () => {
    expect(html).toContain('GWLeith Revenue Growth Solutions')
    expect(html).toContain('1 Example St, Saskatoon SK S7K 0A1')
  })

  it('states why the recipient is getting the message', () => {
    expect(html).toContain('prior business relationship')
  })

  it('accepts a campaign-specific reason override', () => {
    const custom = renderToStaticMarkup(
      <CampaignFooter unsubscribeUrl={URL_} senderIdentity={IDENTITY} reason="You attended the Regina keynote." />,
    )
    expect(custom).toContain('You attended the Regina keynote.')
    expect(custom).not.toContain(DEFAULT_CAMPAIGN_REASON)
  })
})

describe('campaignFooterText — plain-text alternative', () => {
  const text = campaignFooterText({ unsubscribeUrl: URL_, senderIdentity: IDENTITY })

  it('carries the unsubscribe URL verbatim, unwrapped and unescaped', () => {
    expect(text).toContain(`Unsubscribe: ${URL_}`)
  })

  it('carries the identity lines', () => {
    expect(text).toContain('GWLeith Revenue Growth Solutions')
    expect(text).toContain('1 Example St, Saskatoon SK S7K 0A1')
  })

  it('carries the reason line', () => {
    expect(text).toContain('prior business relationship')
  })
})
