import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BOOK_PREORDER_PATH } from '@/lib/book/preorder'
import { TIERS } from '@/lib/pricing'
import {
  MUST_CITE_HOME_DEFINITION,
  MUST_CITE_HOME_OFFICIAL_URL,
} from '@/lib/seo/mustCite'
import {
  EM_DASH,
  HERO_IMAGE_ALT,
  HERO_IMAGE_HEIGHT,
  HERO_IMAGE_MD5,
  HERO_IMAGE_OBJECT_POSITION,
  HERO_IMAGE_SRC,
  HERO_IMAGE_WIDTH,
  HOME_ARIA,
  HOME_BOOK,
  HOME_BOOK_COVER_ALT,
  HOME_BOOK_COVER_HEIGHT,
  HOME_BOOK_COVER_MD5,
  HOME_BOOK_COVER_SRC,
  HOME_BOOK_COVER_WIDTH,
  HOME_H1,
  HOME_ARCHITECTURE_LABEL,
  HOME_ARCHITECTURE_TOOLTIP,
  HOME_JOIN_FREE,
  HOME_JOIN_FREE_TOOLTIP,
  HOME_ACADEMY_TOOLTIP,
  HOME_MEDIA_TOOLTIP,
  HOME_PODCAST_TOOLTIP,
  HOME_SEE_PRICING_TOOLTIP,
  HOME_SIGN_IN_TOOLTIP,
  HOME_LADDER,
  HOME_LADDER_LINE,
  HOME_MEDIA_HREF,
  HOME_MEDIA_LINK,
  HOME_MEDIA_STORY_COUNT,
  HOME_MEDIA_TITLE,
  HOME_NAV_LINKS,
  HOME_PRIMARY_CTA,
  HOME_SECONDARY_CTA,
  HOME_SUB,
  HOME_TITLE,
  JOIN_FREE_HREF,
  SEE_PRICING_HREF,
  conversionCopyStrings,
  hasEmDash,
  homeEpisodeKicker,
  homeEpisodeMeta,
  homeNavTooltip,
  homeWhatEvolvedProsCopy,
} from './conversion'

describe('conversion homepage locks', () => {
  it('uses the locked title, promise, and CTA labels', () => {
    expect(HOME_TITLE).toBe(
      'Evolved Pros | The daily operating system for sales professionals',
    )
    expect(HOME_H1).toBe('The daily operating system for sales professionals.')
    expect(HOME_SUB).toBe(
      'Everything but the curriculum is free. The Academy is what you upgrade for.',
    )
    expect(HOME_PRIMARY_CTA).toBe('Join free. Full community, no card')
    expect(HOME_PODCAST_TOOLTIP).toBe('The Evolved Pros Podcast. Free for everyone.')
    expect(HOME_MEDIA_TOOLTIP).toBe('Evolved Media. Essays and stories from the desk.')
    expect(HOME_ACADEMY_TOOLTIP).toBe(
      'Academy curriculum is for members. Preview the pillars or sign in to continue.',
    )
    expect(HOME_SIGN_IN_TOOLTIP).toBe('Already a member? Sign in to continue.')
    expect(HOME_JOIN_FREE_TOOLTIP).toBe('Free community access. No card required.')
    expect(HOME_SEE_PRICING_TOOLTIP).toBe(
      'Community is free forever. See VIP and Professional when you are ready.',
    )
    expect(HOME_ARCHITECTURE_LABEL).toBe('THE EVOLVED ARCHITECTURE')
    expect(HOME_ARCHITECTURE_TOOLTIP).toBe(
      'The six-pillar operating system. Foundation through Execution.',
    )
    expect(homeNavTooltip('Podcast')).toBe(HOME_PODCAST_TOOLTIP)
    expect(homeNavTooltip('Media')).toBe(HOME_MEDIA_TOOLTIP)
    expect(homeNavTooltip('Academy')).toBe(HOME_ACADEMY_TOOLTIP)
    expect(homeNavTooltip('LIVE')).toBeUndefined()
    expect(HOME_SECONDARY_CTA).toBe('See pricing')
    expect(HOME_LADDER_LINE).toBe(
      'Start free. Upgrade when the Academy is the next step.',
    )
    expect(HOME_ARIA).toBe('Evolved Pros home')
    expect(HERO_IMAGE_ALT).toBe('The Evolved Architecture')
    expect(HERO_IMAGE_SRC).toBe('/brand/hero-evolved-architecture.png')
    expect(HERO_IMAGE_MD5).toBe('f85975f745840817929c6b474dabbfc8')
    expect(HERO_IMAGE_OBJECT_POSITION).toBe('center 20%')
    expect(HERO_IMAGE_WIDTH / HERO_IMAGE_HEIGHT).toBe(1.5)
  })

  it('sends primary Join free to signup, not /pricing or the /join 308', () => {
    expect(JOIN_FREE_HREF).toBe('/login?mode=signup')
    expect(SEE_PRICING_HREF).toBe('/pricing')
    expect(HOME_LADDER[0]?.href).toBe(JOIN_FREE_HREF)
    expect(HOME_LADDER[0]?.cta).toBe(HOME_JOIN_FREE)
    for (const href of [JOIN_FREE_HREF, HOME_LADDER[0]!.href]) {
      expect(href).not.toBe('/join')
      expect(href).not.toBe('/pricing')
    }
  })

  it('keeps the $49 / $249 sequence and does not feature Professional', () => {
    expect(TIERS.vip.monthly).toBe(49)
    expect(TIERS.professional.monthly).toBe(249)
    expect(HOME_LADDER.map(c => c.name)).toEqual(['Community', 'VIP', 'Professional'])
    expect(HOME_LADDER[1]?.price).toBe('$49 / mo')
    expect(HOME_LADDER[2]?.price).toBe('$249 / mo')
    expect(HOME_LADDER[0]?.featured).toBe(true)
    expect(HOME_LADDER[1]?.featured).toBe(false)
    expect(HOME_LADDER[2]?.featured).toBe(false)
    expect(HOME_LADDER[1]?.href).toBe(SEE_PRICING_HREF)
    expect(HOME_LADDER[2]?.href).toBe(SEE_PRICING_HREF)
  })

  it('nav is logo doors plus LIVE to /live, with no Book George', () => {
    expect(HOME_NAV_LINKS.map(l => [l.label, l.href])).toEqual([
      ['Podcast', '/podcast'],
      ['Media', '/media'],
      ['Academy', '/academy'],
      ['LIVE', '/live'],
    ])
    const blob = conversionCopyStrings().join(' ').toLowerCase()
    expect(blob).not.toContain('book george')
    expect(blob).not.toContain('keynote')
    expect(HOME_BOOK.href).toBe(BOOK_PREORDER_PATH)
    expect(HOME_BOOK.href).toBe('/evolved')
    expect(HOME_BOOK.release).toBe('On Amazon Oct 15.')
    expect(HOME_BOOK.cta).toBe('Pre-order now')
    expect(HOME_BOOK.body).toBe(
      'I left the old game on purpose. EVOLVED is the transition I designed: Book, Podcast, Platform, Academy, Fit & Health, LIVE. Learn the system before the room fills.',
    )
    expect(HOME_BOOK_COVER_SRC).toBe('/brand/book-cover.png')
    expect(HOME_BOOK_COVER_ALT).toBe('EVOLVED by George Leith')
    expect(HOME_BOOK_COVER_MD5).toBe('5b2cc6bea409220017f93e055f51f779')
    expect(HOME_BOOK_COVER_WIDTH).toBe(3334)
    expect(HOME_BOOK_COVER_HEIGHT).toBe(5334)
    expect(HOME_BOOK_COVER_SRC).not.toBe('/ads/book-cover.png')
    expect(HOME_BOOK.href).not.toContain('amazon')
    expect(HOME_BOOK.href).not.toContain('B0')
  })

  it('strips only the Official site line from What Evolved Pros is', () => {
    expect(MUST_CITE_HOME_DEFINITION).toContain(MUST_CITE_HOME_OFFICIAL_URL)
    expect(homeWhatEvolvedProsCopy()).toContain('not a podcast alone')
    expect(homeWhatEvolvedProsCopy()).toContain('Everything but the curriculum is designed to be open.')
    expect(homeWhatEvolvedProsCopy()).not.toContain('Official site:')
    expect(homeWhatEvolvedProsCopy()).not.toContain(MUST_CITE_HOME_OFFICIAL_URL)
  })

  it('pins Evolved Media to the three newest desk stories', () => {
    expect(HOME_MEDIA_TITLE).toBe('Evolved Media')
    expect(HOME_MEDIA_LINK).toBe('All stories')
    expect(HOME_MEDIA_HREF).toBe('/media')
    expect(HOME_MEDIA_STORY_COUNT).toBe(3)
  })

  it('has zero U+2014 on title, meta, copy, and aria', () => {
    for (const value of conversionCopyStrings()) {
      expect(hasEmDash(value), value).toBe(false)
      expect(value).not.toContain(EM_DASH)
    }
  })
})

describe('conversion homepage layout contracts', () => {
  const root = dirname(fileURLToPath(import.meta.url))
  const conversionHomeSrc = readFileSync(
    resolve(root, '../../components/home/ConversionHome.tsx'),
    'utf8',
  )
  const conversionPageSrc = readFileSync(
    resolve(root, '../../app/(public)/page.tsx'),
    'utf8',
  )
  const globalsSrc = readFileSync(resolve(root, '../../app/globals.css'), 'utf8')

  it('reserves the architecture hero box and keeps JOIN FREE off the wrapping nav', () => {
    expect(conversionHomeSrc).toMatch(/ep-home-fold-still/)
    expect(conversionHomeSrc).toMatch(/HERO_IMAGE_WIDTH/)
    expect(conversionHomeSrc).toMatch(/JOIN_FREE_HREF/)
    expect(conversionHomeSrc).toMatch(/shrink-0 items-center bg-red/)
    expect(conversionHomeSrc).toMatch(/flex h-10 items-center justify-between/)
    expect(conversionHomeSrc).not.toMatch(
      /header[\s\S]{0,80}flex max-w-6xl flex-wrap items-center justify-between/,
    )
  })

  it('keeps the desktop value prop and Join free in the first viewport', () => {
    expect(conversionHomeSrc).toMatch(/ep-home-fold/)
    expect(conversionHomeSrc).toMatch(/100svh/)
    expect(conversionHomeSrc).toMatch(/HOME_JOIN_FREE_TOOLTIP/)
    expect(conversionHomeSrc).toMatch(/homeNavTooltip/)
    expect(conversionHomeSrc).toMatch(/HOME_SIGN_IN_TOOLTIP/)
    expect(conversionHomeSrc).toMatch(/HOME_SEE_PRICING_TOOLTIP/)
    expect(conversionHomeSrc).toMatch(/HOME_ARCHITECTURE_LABEL/)
    expect(conversionHomeSrc).toMatch(/HOME_ARCHITECTURE_TOOLTIP/)
    expect(conversionHomeSrc).not.toMatch(/homeNavTooltip\('LIVE'\)|label === 'LIVE' \?/)
    expect(conversionHomeSrc).toMatch(/loginHrefFor\('\/academy'\)/)
  })

  it('puts signed-out primary Join free in the first mobile viewport over the GOLD still', () => {
    expect(conversionHomeSrc).toMatch(/min-h-\[calc\(100svh-7rem\)\]/)
    expect(conversionHomeSrc).toMatch(/md:min-h-\[calc\(100svh-5\.5rem\)\]/)
    expect(conversionHomeSrc).toMatch(/ep-home-fold-still/)
    expect(conversionHomeSrc).toMatch(/flex-col items-center justify-end/)
    expect(conversionHomeSrc).toMatch(/bg-gradient-to-t from-paper/)
    expect(conversionHomeSrc).not.toMatch(/max-md:scale-\[1\.32\]/)
    expect(conversionHomeSrc).not.toMatch(/hidden h-2\/3 bg-gradient-to-t/)
    expect(conversionHomeSrc).not.toMatch(
      /relative aspect-\[3\/2\] w-full md:absolute md:inset-0/,
    )
    expect(conversionHomeSrc).toMatch(/label=\{HOME_PRIMARY_CTA\}/)
    expect(conversionHomeSrc).toMatch(/href=\{JOIN_FREE_HREF\}/)
    expect(conversionHomeSrc).toMatch(/HOME_OPEN_PLATFORM_HREF/)
    expect(conversionHomeSrc.indexOf('signedIn ?')).toBeGreaterThan(-1)
  })

  it('uses one GOLD still in both themes with no invert or theme-switched src', () => {
    expect(conversionHomeSrc).toMatch(/src=\{HERO_IMAGE_SRC\}/)
    expect(conversionHomeSrc).not.toMatch(/dark:.*HERO_IMAGE|HERO_IMAGE.*dark:/)
    expect(conversionHomeSrc).not.toMatch(/invert|brightness-|hue-rotate|filter:/)
    expect(conversionHomeSrc.match(/src=\{HERO_IMAGE_SRC\}/g)?.length).toBe(1)
    expect(conversionPageSrc).toMatch(/url: HERO_IMAGE_SRC/)
    expect(conversionPageSrc).toMatch(/images: \[HERO_IMAGE_SRC\]/)
  })

  it('ships the locked GOLD Architecture still at the public brand path', () => {
    const bytes = readFileSync(
      resolve(root, '../../public/brand/hero-evolved-architecture.png'),
    )
    expect(createHash('md5').update(bytes).digest('hex')).toBe(HERO_IMAGE_MD5)
  })

  it('puts the FINAL EVOLVED cover on the book card from public /brand, not ads', () => {
    expect(conversionHomeSrc).toMatch(/src=\{HOME_BOOK_COVER_SRC\}/)
    expect(conversionHomeSrc).toMatch(/alt=\{HOME_BOOK_COVER_ALT\}/)
    expect(conversionHomeSrc).toMatch(/HOME_BOOK_COVER_WIDTH/)
    expect(conversionHomeSrc).toMatch(/HOME_BOOK_COVER_HEIGHT/)
    expect(conversionHomeSrc).toMatch(/h-auto w-full/)
    expect(conversionHomeSrc).not.toMatch(/\/ads\/book-cover/)
    expect(conversionHomeSrc).not.toMatch(/lib\/book\/preorder/)
    const bytes = readFileSync(resolve(root, '../../public/brand/book-cover.png'))
    expect(createHash('md5').update(bytes).digest('hex')).toBe(HOME_BOOK_COVER_MD5)
  })

  it('keeps conversion `/` ad-free — no IAB, slots, or platform_ads', () => {
    for (const src of [conversionHomeSrc, conversionPageSrc]) {
      expect(src).not.toMatch(
        /IabAdvertisementSlot|IabImageAd|HomeSponsorAd|AdSlot|interleaveAds|platform_ads/,
      )
    }
  })

  it('crops the GOLD Architecture still toward pillars and named elements', () => {
    expect(conversionHomeSrc).toMatch(/HERO_IMAGE_OBJECT_POSITION/)
    expect(conversionHomeSrc).toMatch(/object-\[center_20%\]/)
    expect(conversionHomeSrc).toMatch(/objectPosition: HERO_IMAGE_OBJECT_POSITION/)
    expect(conversionHomeSrc).toMatch(/ep-home-arch-label/)
    expect(conversionHomeSrc).toMatch(/HOME_ARCHITECTURE_LABEL/)
    expect(globalsSrc).toMatch(/\.ep-home-fold-still/)
    expect(globalsSrc).toMatch(/height: 38%/)
    expect(globalsSrc).toMatch(/max-width: 430px/)
  })

  it('renders the locked Writer #1 book body and keeps Official site off `/`', () => {
    expect(conversionHomeSrc).toMatch(/HOME_BOOK\.body/)
    expect(conversionHomeSrc).not.toMatch(/TODO\(George\): body HOLD/)
    expect(conversionHomeSrc).not.toMatch(/MUST_CITE_HOME_OFFICIAL_URL/)
    expect(conversionHomeSrc).toMatch(/homeWhatEvolvedProsCopy/)
  })

  it('shows Evolved Media titles from the desk and face-crops guest stills', () => {
    expect(conversionHomeSrc).toMatch(/HOME_MEDIA_TITLE/)
    expect(conversionHomeSrc).toMatch(/HOME_MEDIA_HREF/)
    expect(conversionHomeSrc).toMatch(/homeGuestStillObjectPosition/)
    expect(conversionPageSrc).toMatch(/getPublishedMediaStoriesForHub/)
    expect(conversionPageSrc).toMatch(/HOME_MEDIA_STORY_COUNT/)
    expect(conversionPageSrc).toMatch(/mediaStoryHref/)
  })

  it('mounts the Fit instructional-guide tease on conversion `/`', () => {
    expect(conversionHomeSrc).toMatch(/HomeFitTeaseBand/)
    expect(conversionHomeSrc).toMatch(/viewerTier=\{viewerTier\}/)
    expect(conversionPageSrc).toMatch(/viewerTier=\{profile\?\.tier \?\? null\}/)
    expect(globalsSrc).toMatch(/\.ep-conversion-home \.ep-fit-masthead-logo--on-light/)
  })
})

describe('home episode display', () => {
  it('pads the EP kicker and joins date + duration without an em dash', () => {
    expect(homeEpisodeKicker(7)).toBe('EP 007')
    expect(homeEpisodeKicker(null)).toBe('EPISODE')
    const meta = homeEpisodeMeta('2026-09-02T12:00:00Z', 65 * 60)
    expect(meta).toBe('SEP 2 · 65 MIN')
    expect(hasEmDash(meta)).toBe(false)
  })
})
