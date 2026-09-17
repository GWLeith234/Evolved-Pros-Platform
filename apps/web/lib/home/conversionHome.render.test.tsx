import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ConversionHome } from '@/components/home/ConversionHome'
import {
  HOME_JOIN_FREE,
  HOME_OPEN_PLATFORM,
  HOME_SECONDARY_CTA,
  JOIN_FREE_HREF,
  HOME_OPEN_PLATFORM_HREF,
  SEE_PRICING_HREF,
} from './conversion'
import { EVENTS_LOGIN_HEADLINE, EVENTS_LOGIN_BODY, gatedIntentFor } from '@/lib/auth/gatedIntent'
import { GatedIntentWall } from '@/components/auth/GatedIntentWall'
import { MediaMastheadLockup } from '@/components/media/Masthead'
import { MEDIA_LOCKUP_LIGHT } from '@/lib/lockups'

describe('conversion home fold CTAs', () => {
  it('keeps Open the platform primary red and Join free second above fold', () => {
    const html = renderToStaticMarkup(
      <ConversionHome signedIn={false} episodes={[]} stories={[]} />,
    )
    expect(html).toContain(HOME_OPEN_PLATFORM)
    expect(html).toContain(HOME_JOIN_FREE)
    expect(html).toContain(HOME_SECONDARY_CTA)
    expect(html).toContain(`href="${HOME_OPEN_PLATFORM_HREF}"`)
    expect(html).toContain(`href="${JOIN_FREE_HREF}"`)
    expect(html).toContain(`href="${SEE_PRICING_HREF}"`)
    const fold = html.slice(html.indexOf('ep-home-fold-copy'))
    expect(fold.indexOf(HOME_OPEN_PLATFORM)).toBeGreaterThan(-1)
    expect(fold.indexOf(HOME_JOIN_FREE)).toBeGreaterThan(-1)
    expect(fold.indexOf(HOME_SECONDARY_CTA)).toBeGreaterThan(-1)
    expect(fold.indexOf(HOME_OPEN_PLATFORM)).toBeLessThan(fold.indexOf(HOME_JOIN_FREE))
    expect(fold.indexOf(HOME_JOIN_FREE)).toBeLessThan(fold.indexOf(HOME_SECONDARY_CTA))
    expect(html).toContain('bg-red')
    expect(html).not.toContain('\u2014')
  })
})

describe('events login banner', () => {
  it('renders Member event details and does not mention /live', () => {
    const intent = gatedIntentFor('/events')
    const html = renderToStaticMarkup(<GatedIntentWall intent={intent!} />)
    expect(html).toContain(EVENTS_LOGIN_HEADLINE)
    expect(html).toContain(EVENTS_LOGIN_BODY)
    expect(html).not.toContain('/live')
    expect(html).not.toContain('\u2014')
  })
})

describe('media parchment lockup', () => {
  it('ships the navy-letter Media lockup for parchment', () => {
    const html = renderToStaticMarkup(<MediaMastheadLockup />)
    expect(html).toContain(MEDIA_LOCKUP_LIGHT)
    expect(html).not.toContain('\u2014')
  })
})
