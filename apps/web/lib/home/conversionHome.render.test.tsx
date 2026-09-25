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
import { MEDIA_LOCKUP_DARK, MEDIA_LOCKUP_LABEL, MEDIA_LOCKUP_LIGHT } from '@/lib/lockups'

function foldCtasHtml(html: string): string {
  const start = html.indexOf('ep-home-fold-ctas')
  expect(start).toBeGreaterThan(-1)
  const next = html.indexOf('id="what-is-evolved-pros"', start)
  return next > start ? html.slice(start, next) : html.slice(start)
}

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
    const ctas = foldCtasHtml(html)
    expect(ctas).toContain('ep-home-fold-ctas-lead')
    expect(ctas.indexOf(HOME_OPEN_PLATFORM)).toBeGreaterThan(-1)
    expect(ctas.indexOf(HOME_JOIN_FREE)).toBeGreaterThan(-1)
    expect(ctas.indexOf(HOME_SECONDARY_CTA)).toBeGreaterThan(-1)
    expect(ctas.indexOf(HOME_OPEN_PLATFORM)).toBeLessThan(ctas.indexOf(HOME_JOIN_FREE))
    expect(ctas.indexOf(HOME_JOIN_FREE)).toBeLessThan(ctas.indexOf(HOME_SECONDARY_CTA))
    expect(ctas).toContain(`href="${JOIN_FREE_HREF}"`)
    expect(html).toContain('bg-red')
    expect(html).not.toContain('\u2014')
    expect(html).not.toContain('ThemeToggle')
  })

  it('does not drop Join free from the fold cluster on cold signed-out', () => {
    const html = renderToStaticMarkup(
      <ConversionHome signedIn={false} episodes={[]} stories={[]} />,
    )
    const leadStart = html.indexOf('ep-home-fold-ctas-lead')
    expect(leadStart).toBeGreaterThan(-1)
    const see = html.indexOf(HOME_SECONDARY_CTA, leadStart)
    const lead = html.slice(leadStart, see)
    expect(lead).toContain(HOME_OPEN_PLATFORM)
    expect(lead).toContain(HOME_JOIN_FREE)
    expect(lead).toContain(`href="${JOIN_FREE_HREF}"`)
    expect(lead.indexOf(HOME_OPEN_PLATFORM)).toBeLessThan(lead.indexOf(HOME_JOIN_FREE))
    expect(lead).not.toContain(HOME_SECONDARY_CTA)
  })

  it('keeps Join free in the fold even when a session is present', () => {
    const html = renderToStaticMarkup(
      <ConversionHome signedIn episodes={[]} stories={[]} />,
    )
    const ctas = foldCtasHtml(html)
    expect(ctas).toContain(HOME_JOIN_FREE)
    expect(ctas).toContain(`href="${JOIN_FREE_HREF}"`)
    expect(ctas.indexOf(HOME_OPEN_PLATFORM)).toBeLessThan(ctas.indexOf(HOME_JOIN_FREE))
    expect(html).toContain(HOME_OPEN_PLATFORM)
  })
})

describe('home footer', () => {
  it('links About before Privacy and Terms, in the shared footer order', () => {
    const html = renderToStaticMarkup(
      <ConversionHome signedIn={false} episodes={[]} stories={[]} />,
    )
    const footerStart = html.lastIndexOf('<footer')
    expect(footerStart).toBeGreaterThan(-1)
    const footer = html.slice(footerStart)
    const about = footer.indexOf('href="/about"')
    const privacy = footer.indexOf('href="/privacy"')
    const terms = footer.indexOf('href="/terms"')
    expect(about).toBeGreaterThan(-1)
    expect(privacy).toBeGreaterThan(about)
    expect(terms).toBeGreaterThan(privacy)
    expect(footer).toContain('>About<')
    expect(footer).toContain('>Privacy<')
    expect(footer).toContain('>Terms<')
    expect(footer).not.toContain('\u2014')
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
  it('ships the theme-swapped lockup PNG pair without an em dash', () => {
    const html = renderToStaticMarkup(<MediaMastheadLockup />)
    expect(html).toContain(MEDIA_LOCKUP_DARK)
    expect(html).toContain(MEDIA_LOCKUP_LIGHT)
    expect(html).toContain(`aria-label="${MEDIA_LOCKUP_LABEL}"`)
    expect(html).not.toContain('EVOLVED')
    expect(html).not.toContain('\u2014')
  })
})
