import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { HERO_IMAGE_ALT, HERO_IMAGE_SRC, HOME_META_DESCRIPTION, HOME_SUB, HOME_TITLE } from '@/lib/home/conversion'
import { mediaStoryTitle } from '@/lib/media/brand'
import type { MediaStoryRecord } from '@/lib/media/storyRecord'
import { mediaStorySocialMetadata, publishedStoryDescription } from '@/lib/media/storyMeta'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { articleJsonLd, ORGANIZATION_ID, PRICING_PAGE_DESCRIPTION } from '@/lib/seo/jsonld'
import { mediaPillarCollectionDescription } from '@/lib/seo/mediaCollectionJsonLd'
import {
  META_DESCRIPTION_MAX,
  META_DESCRIPTION_MIN,
  META_DESCRIPTION_OVERRIDES,
  OUTBOUND_STACK_META_DESCRIPTION,
  articleSearchSnippet,
  fitMetaDescription,
  joinEmDashClause,
  metaDescriptionNeedsMidSentenceCut,
  metaDescriptionOverride,
  plainTextBlocks,
  PRICING_META_DESCRIPTION,
  trimMetaDescription,
} from './metaDescription'

const here = dirname(fileURLToPath(import.meta.url))

function assertInRange(text: string) {
  expect(text.length).toBeGreaterThanOrEqual(META_DESCRIPTION_MIN)
  expect(text.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX)
}

function assertWordBoundary(source: string, trimmed: string) {
  const collapsed = source.replace(/\s+/g, ' ').trim()
  assertInRange(trimmed)
  expect(collapsed.startsWith(trimmed)).toBe(true)
  const rest = collapsed.slice(trimmed.length)
  expect(rest === '' || /^[\s,;:|/\\–—-]/u.test(rest)).toBe(true)
}

const OVER_LONG = [
  'Channel veteran Juan Fernandez on taking MSPs from managed to modern: outcome-based buying, the hot pan risks of ungoverned AI, betting on humans, and the federal contract collapse that cost him everything.',
  "Journalist-turned-storyteller Jim Thompson on selling as service, telling stories with numbers, lessons from Gary Vaynerchuk's team, and why trust. built through story. is what unlocks word of mouth.",
  'Berlin advisor Martin Scholz on partnerships as the evolution of go-to-market: why 80% fail, what actually makes them work, and his reinvention from burnout-travel executive to a life that fits.',
  "Calisthenics coach Carson Teagarden on fitness that lasts: consistency over intensity, two or three goals not fifty, why it's growth not pain, and accountability as the real difference-maker.",
  "Dennis Yu joins George Leith for the Evolved Pros debut: evolving with AI, taking 'the network view,' hiring by proof, agents as multipliers, and why your value isn't your skill set.",
  'Anthropic shipped a frontier AI model, then deliberately put walls around it. The restraint is the story. and a lesson for anyone betting their craft on these tools.',
  'Every book on resilience will tell you to reframe failure. What they will not tell you is the entry fee: you have to stay in the hard situation long enough for the lesson to land.',
  'The sales industry is obsessed with talent. The natural closer. The born communicator. The most consistent performers are almost never the most talented people in the room.',
  "Google's Business Home beta and an overnight backlink bot show what AI agents really take off your plate. It's the chores. Deciding what's worth doing is still on you.",
] as const

describe('meta description bounds', () => {
  it('leaves an in-range description unchanged', () => {
    const text = 'Pioneer stories, leadership insights, and business strategy from the EVOLVED framework.'
    expect(text.length).toBeGreaterThanOrEqual(META_DESCRIPTION_MIN)
    expect(text.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX)
    expect(trimMetaDescription(text)).toBe(text)
    expect(fitMetaDescription(text, ['A later paragraph that must stay out of the snippet.'])).toBe(text)
  })

  it('trims every crawled over-long description on a word boundary', () => {
    for (const source of OVER_LONG) {
      expect(source.length).toBeGreaterThan(META_DESCRIPTION_MAX)
      assertWordBoundary(source, trimMetaDescription(source))
      expect(fitMetaDescription(source, ['Extra paragraph that must not lead the snippet.'])).toBe(
        trimMetaDescription(source),
      )
    }
  })

  it('extends a short dek with the next existing paragraph and stops at 155', () => {
    const dek = 'The SOW looked clean. The token burn did not.'
    const paragraph = "Seats, tokens, and people are three different bills. Digiday's Kimeko McCoy put the anatomy in print on September 17, 2026. If an exec got a regular bill for third-party AI tool costs, it would show subscriptions for tools like Claude."
    const fitted = fitMetaDescription(dek, [paragraph])
    assertWordBoundary(`${dek} ${paragraph}`, fitted)
    expect(fitted.startsWith(dek)).toBe(true)
  })

  it('does not invent copy when a short dek has no longer source text', () => {
    const dek = 'The SOW looked clean. The token burn did not.'
    expect(fitMetaDescription(dek, [dek])).toBe(dek)
    expect(dek.length).toBeLessThan(META_DESCRIPTION_MIN)
  })
})

describe('published story descriptions', () => {
  it('keeps a legal dek and does not append the body', () => {
    const dek = 'Most people do not lack discipline. They lack a system that makes the gap between who they are and who they said they would be visible every day.'
    expect(dek.length).toBeGreaterThanOrEqual(META_DESCRIPTION_MIN)
    expect(dek.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX)
    expect(publishedStoryDescription({
      seo_description: dek,
      excerpt: dek,
      body: `${dek}\n\nA later paragraph that must not be appended.`,
    })).toBe(dek)
  })

  it('trims a long dek without editing the stored sentence into new copy', () => {
    const dek = OVER_LONG[7]
    const description = publishedStoryDescription({
      seo_description: dek,
      excerpt: 'A different card dek that must not replace the long SEO description.',
      body: 'A first paragraph that is not the dek.',
    })
    expect(description).toBe(trimMetaDescription(dek))
    assertWordBoundary(dek, description)
  })

  it('extends the three short article deks from the following body paragraph', () => {
    const cases = [
      {
        dek: 'The SOW looked clean. The token burn did not.',
        next: "Seats, tokens, and people are three different bills. Digiday's Kimeko McCoy put the anatomy in print on September 17, 2026.",
      },
      {
        dek: 'The planning deck opened on social again. I pulled the home screen.',
        next: 'Search, video, maps, mail, and commerce still own the daily opens while social time slips. That is the attention map.',
      },
      {
        dek: 'The creator pitch landed. The CFO still asked what counts as a view.',
        next: 'Until that answer is boring, the budget stays stuck in brand-safety theater.',
      },
    ]
    for (const item of cases) {
      expect(item.dek.length).toBeLessThan(META_DESCRIPTION_MIN)
      const description = publishedStoryDescription({
        seo_description: item.dek,
        excerpt: item.dek,
        body: `${item.dek}\n\n${item.next}\n\nA later paragraph that should not be required.`,
      })
      assertInRange(description)
      expect(description.startsWith(item.dek)).toBe(true)
      expect(description).not.toContain('A later paragraph')
    }
  })

  it('reads plain paragraphs out of markdown', () => {
    expect(plainTextBlocks('## Lead\n\nThe **gap** is the work.\n\nNext.')).toEqual([
      'Lead',
      'The gap is the work.',
      'Next.',
    ])
  })
})

describe('pillar hub descriptions', () => {
  it('keeps the desk sentence when a hub has no stories', () => {
    expect(mediaPillarCollectionDescription('Foundation')).toBe(
      'Foundation stories from the Evolved Pros desk.',
    )
  })

  it('builds each hub from its label and whole latest titles inside 70-155', () => {
    const hubs: Record<string, readonly string[]> = {
      Foundation: ['Hard-Boiled Eggs: The Easiest Protein Snack Hack I Still Use', 'I Am Addicted to Kettlebells: Five Exercises for Desk and Travel Sales Pros'],
      Identity: ['I Have 23 Grok Bots. I Use Them Everywhere.', 'A Good Pair of Boots: What Tecovas in Denver Reminded Me About Identity'],
      'Mental Toughness': ['Five Travel Must-Haves I Will Not Leave Home Without', 'Adopting a New Habit: What Actually Improves Your Odds of Sticking'],
      Strategy: ["What AI Agents Actually Automate (and What They Don't)", 'AI Is a Creative Tool, Not the Creative'],
      Accountability: ['Pipeline Is Not a Wish List', "How Much AI Slop Did We Publish in May? Let's Be Honest.", 'The Accountability Framework for Sales Teams'],
      Execution: ['Call Review That Makes Reps Better in 20 Minutes', 'Mutual Action Plans Buyers Will Actually Follow'],
    }
    const descriptions = Object.entries(hubs).map(([label, titles]) => {
      const description = mediaPillarCollectionDescription(label, titles)
      assertInRange(description)
      expect(description.startsWith(`${label} stories from the Evolved Pros desk.`)).toBe(true)
      expect(description).toContain(titles[0])
      return description
    })
    expect(new Set(descriptions).size).toBe(descriptions.length)
    expect(mediaPillarCollectionDescription('Accountability', hubs.Accountability)).toBe(
      "Accountability stories from the Evolved Pros desk. Pipeline Is Not a Wish List, How Much AI Slop Did We Publish in May? Let's Be Honest.",
    )
    expect(mediaPillarCollectionDescription('Identity', ['Trust \u2014 built through story'])).not.toContain('\u2014')
  })

  it('trims one oversized title instead of leaving the desk sentence short', () => {
    const title = 'Word '.repeat(40).trim()
    const description = mediaPillarCollectionDescription('Foundation', [title])
    assertInRange(description)
    expect(description.startsWith('Foundation stories from the Evolved Pros desk.')).toBe(true)
    expect(description).not.toContain('\u2014')
  })
})

describe('home and pricing snippets', () => {
  it('keeps the home description, og:description, and twitter:description on the new sentence', () => {
    expect(HOME_META_DESCRIPTION).toBe(
      'Evolved Pros is the daily operating system for sales pros, founded by George Leith. Community, podcast and media are free; The Academy is the upgrade.',
    )
    expect(HOME_META_DESCRIPTION.length).toBe(150)
    assertInRange(HOME_META_DESCRIPTION)
    expect(HOME_SUB).toBe(
      'Everything but the curriculum is free. The Academy is what you upgrade for.',
    )

    const page = readFileSync(resolve(here, '../../app/(public)/(home)/page.tsx'), 'utf8')
    expect(page).toContain('description: HOME_META_DESCRIPTION')
    expect(page).not.toContain('HOME_SUB')
    expect(page).toContain('title: HOME_TITLE')
    expect(page).toContain('images: [{ url: HERO_IMAGE_SRC, alt: HERO_IMAGE_ALT }]')
    expect(page).toContain('images: [HERO_IMAGE_SRC]')
    expect(page).toContain('homeJsonLd()')

    const meta = publicPageMetadata('/', {
      title: HOME_TITLE,
      description: HOME_META_DESCRIPTION,
      openGraph: {
        title: HOME_TITLE,
        description: HOME_META_DESCRIPTION,
        images: [{ url: HERO_IMAGE_SRC, alt: HERO_IMAGE_ALT }],
      },
      twitter: {
        card: 'summary_large_image',
        title: HOME_TITLE,
        description: HOME_META_DESCRIPTION,
        images: [HERO_IMAGE_SRC],
      },
    })
    expect(meta.title).toBe(HOME_TITLE)
    expect(meta.description).toBe(HOME_META_DESCRIPTION)
    expect(meta.openGraph?.description).toBe(HOME_META_DESCRIPTION)
    expect(meta.openGraph?.title).toBe(HOME_TITLE)
    expect(meta.openGraph?.images).toEqual([{ url: HERO_IMAGE_SRC, alt: HERO_IMAGE_ALT }])
    expect(meta.alternates?.canonical).toBe('https://www.evolvedpros.com')
    expect(meta.openGraph?.url).toBe('https://www.evolvedpros.com')
    const twitter = meta.twitter as { title?: string; description?: string; images?: string[] }
    expect(twitter.description).toBe(HOME_META_DESCRIPTION)
    expect(twitter.title).toBe(HOME_TITLE)
    expect(twitter.images).toEqual([HERO_IMAGE_SRC])
  })

  it('keeps the pricing description and the copied og/twitter descriptions on the new sentence', () => {
    expect(PRICING_META_DESCRIPTION).toBe(
      'Compare Evolved Pros plans: Community, VIP, The Evolved Pros 99 and Keynotes. See what each tier includes for sales pros and pick the one that fits you.',
    )
    expect(PRICING_META_DESCRIPTION.length).toBe(152)
    assertInRange(PRICING_META_DESCRIPTION)
    expect(PRICING_PAGE_DESCRIPTION).toBe(
      'Community, VIP, The Evolved Pros 99, and Keynote tiers for high performers.',
    )

    const page = readFileSync(resolve(here, '../../app/(public)/pricing/page.tsx'), 'utf8')
    expect(page).toContain("title: 'Pricing — Evolved Pros'")
    expect(page).toContain('description: PRICING_META_DESCRIPTION')
    expect(page).not.toContain('description: PRICING_PAGE_DESCRIPTION')
    expect(page).toContain('pricingJsonLd()')

    const meta = publicPageMetadata('/pricing', {
      title: 'Pricing — Evolved Pros',
      description: PRICING_META_DESCRIPTION,
    })
    expect(meta.title).toBe('Pricing — Evolved Pros')
    expect(meta.description).toBe(PRICING_META_DESCRIPTION)
    expect(meta.openGraph?.description).toBe(PRICING_META_DESCRIPTION)
    expect(meta.openGraph?.title).toBe('Pricing — Evolved Pros')
    expect(meta.alternates?.canonical).toBe('https://www.evolvedpros.com/pricing')
    expect(meta.openGraph?.url).toBe('https://www.evolvedpros.com/pricing')
    const twitter = meta.twitter as { title?: string; description?: string }
    expect(twitter.description).toBe(PRICING_META_DESCRIPTION)
    expect(twitter.title).toBe('Pricing — Evolved Pros')
  })
})

/**
 * Every sitemap URL whose stored description is over 155 characters.
 * Text is what the helper trims, after the em-dash sanitizer the page already runs.
 * Lengths are the 2026-10-15 crawl.
 */
const SITEMAP_DESCRIPTIONS_OVER_MAX: ReadonlyArray<{ path: string; source: string }> = [
  {
    path: '/podcast/evolved-pros-podcast-ep-010-juan-fernandez',
    source: 'Channel veteran Juan Fernandez on taking MSPs from managed to modern: outcome-based buying, the hot pan risks of ungoverned AI, betting on humans, and the federal contract collapse that cost him everything.',
  },
  {
    path: '/podcast/trust-credibility-cold-calling-jim-thompson',
    source: "Journalist-turned-storyteller Jim Thompson on selling as service, telling stories with numbers, lessons from Gary Vaynerchuk's team, and why trust. built through story. is what unlocks word of mouth.",
  },
  {
    path: '/podcast/reinvention-partnerships-long-game-martin-scholz',
    source: 'Berlin advisor Martin Scholz on partnerships as the evolution of go-to-market: why 80% fail, what actually makes them work, and his reinvention from burnout-travel executive to a life that fits.',
  },
  {
    path: '/podcast/fitness-nutrition-evolved-pros-carson-teagarden',
    source: "Calisthenics coach Carson Teagarden on fitness that lasts: consistency over intensity, two or three goals not fifty, why it's growth not pain, and accountability as the real difference-maker.",
  },
  {
    path: '/podcast/dennis-yu-authority-content',
    source: "Dennis Yu joins George Leith for the Evolved Pros debut: evolving with AI, taking 'the network view,' hiring by proof, agents as multipliers, and why your value isn't your skill set.",
  },
  {
    path: '/podcast/leading-digital-evolution-salem-media-jamie-cohen',
    source: 'Salem Media CDO Jamie Cohen on leading digital transformation: anchoring change in purpose, failing fast, and why the pace only accelerates. with George Leith.',
  },
  {
    path: '/media/strategy/what-happened-to-claudes-fable-5',
    source: 'Anthropic shipped a frontier AI model, then deliberately put walls around it. The restraint is the story, and a lesson for anyone betting their craft on these tools.',
  },
  {
    path: '/media/mental-toughness/the-power-of-resilience-building-mental-toughness-in-sales',
    source: 'Every book on resilience will tell you to reframe failure. What they will not tell you is the entry fee: you have to stay in the hard situation long enough for the lesson to land.',
  },
  {
    path: '/media/execution/execution-excellence-turning-plans-results',
    source: 'The sales industry is obsessed with talent. The natural closer. The born communicator. The most consistent performers are almost never the most talented people in the room.',
  },
  {
    path: '/media/strategy/what-ai-agents-actually-automate',
    source: "Google's Business Home beta and an overnight backlink bot show what AI agents really take off your plate. It's the chores. Deciding what's worth doing is still on you.",
  },
  {
    path: '/media/foundation/cooking-with-tallow-three-recipes',
    source: "Beef tallow is stable, high-heat, and full of flavour. Here's what it is, an honest word on the saturated-fat question, and three recipes that earn their place.",
  },
  {
    path: '/media/strategy/agentic-buying-proof-gap',
    source: 'IAB Europe n=50 across 44 markets: 58% expect agentic buying at operational use or scale within a year, while 36 of 47 still have no day-to-day agentic system o',
  },
  {
    path: '/media/strategy/ai-platforms-need-creators',
    source: 'Social poured money into TV while claiming to replace it. Digiday put the parallel in print on September 16, 2026. AI platforms are chasing creators hard even t',
  },
  {
    path: '/media/strategy/mid-sized-podcast-cpa',
    source: "Audacy's Fall 2026 State of Audio cites Podscribe: mid-sized podcasts delivered 22% lower CPA than celebrity-scale shows. Fame is not the same as conversion.",
  },
  {
    path: '/media/identity/the-industry-teaches-you-to-stand-out-nobody-teaches-you-to-stand-for-something',
    source: 'After 30 years in sales leadership, 165+ events across 21 countries, and $100M+ in recurring revenue built, here is what I know about professional identity.',
  },
]

describe('sitemap descriptions do not end mid-sentence', () => {
  it('fails if any sitemap description would need a mid-sentence cut', () => {
    const unprotected = SITEMAP_DESCRIPTIONS_OVER_MAX.filter(item =>
      metaDescriptionNeedsMidSentenceCut(item.source) && !metaDescriptionOverride(item.path),
    )
    expect(unprotected.map(item => item.path)).toEqual([])

    expect(Object.keys(META_DESCRIPTION_OVERRIDES).sort()).toEqual(
      SITEMAP_DESCRIPTIONS_OVER_MAX.map(item => item.path).sort(),
    )

    for (const item of SITEMAP_DESCRIPTIONS_OVER_MAX) {
      expect(item.source.length).toBeGreaterThan(META_DESCRIPTION_MAX)
      expect(metaDescriptionNeedsMidSentenceCut(item.source)).toBe(true)

      const override = metaDescriptionOverride(item.path)
      expect(override).toBeTruthy()
      const sentence = override ?? ''
      expect(sentence.length).toBeGreaterThanOrEqual(120)
      expect(sentence.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX)
      expect(sentence).toMatch(/[.!?]$/)
      expect(sentence).not.toMatch(/[\u2013\u2014]/)
      expect(metaDescriptionNeedsMidSentenceCut(sentence)).toBe(false)
      expect(sentence).not.toBe(trimMetaDescription(item.source))

      for (const incoming of [item.source, trimMetaDescription(item.source)]) {
        const meta = publicPageMetadata(item.path, {
          description: incoming,
          openGraph: { description: incoming },
          twitter: { description: incoming },
        })
        expect(meta.description).toBe(sentence)
        expect(meta.openGraph?.description).toBe(sentence)
        expect((meta.twitter as { description?: string } | undefined)?.description).toBe(sentence)
      }
    }
  })
})

describe('description wiring', () => {
  it('passes latest story titles into the pillar meta description and the matching JSON-LD', () => {
    const pillar = readFileSync(resolve(here, '../../app/(public)/media/[pillar]/page.tsx'), 'utf8')
    const landing = readFileSync(resolve(here, '../../components/media/MediaSectionLanding.tsx'), 'utf8')
    expect(pillar).toContain('mediaPillarCollectionDescription(label, articles.map(article => article.title))')
    expect(landing).toContain('mediaPillarCollectionDescription(title, articles.map(article => article.title))')
  })
})

const OUTBOUND_PATH = '/media/execution/better-outbound-digital-solutions'
const OUTBOUND_TITLE = 'Get Better at Outbound: The Digital Stack That Works'
const OUTBOUND_H1 = 'Get Better at Outbound: The Digital Stack That Actually Works'
const OUTBOUND_SEO = "The outbound tech market is half genuine leverage and half expensive theatre. Here's the layer-by-layer read on what earns its keep — and what doesn't."
const OUTBOUND_EXCERPT = "The outbound tech market is half genuine leverage and half expensive theatre. Here's the layer-by-layer read on what earns its keep, and what doesn't."
const OUTBOUND_BROKEN = "The outbound tech market is half genuine leverage and half expensive theatre. Here's the layer-by-layer read on what earns its keep. and what doesn't."

/**
 * Published media seo_description values whose em dash sits before a
 * lowercase word. The old sanitizer published a period there.
 */
const EM_DASH_CLAUSE_DESCRIPTIONS: ReadonlyArray<{ path: string; seo: string; rendered: string }> = [
  {
    path: '/media/identity/evolved-pros-origin-story-30-years-sales-leadership',
    seo: 'How 30 years of sales leadership and scaling teams to $100M+ ARR led to founding Evolved Pros — the platform transforming sales professionals worldwide.',
    rendered: 'How 30 years of sales leadership and scaling teams to $100M+ ARR led to founding Evolved Pros, the platform transforming sales professionals worldwide.',
  },
  {
    path: '/media/identity/why-i-created-evolved-pros',
    seo: 'George Leith on losing 220 pounds, rebuilding a career, and why he built Evolved Pros — because the problem was never willpower. It was the container.',
    rendered: 'George Leith on losing 220 pounds, rebuilding a career, and why he built Evolved Pros, because the problem was never willpower. It was the container.',
  },
  {
    path: '/media/identity/why-suitsupply-is-my-favorite-store',
    seo: "A law student started it in 2000 selling Italian-fabric suits at honest prices. What I buy there isn't the suit — it's the fit, and what the fit does.",
    rendered: "A law student started it in 2000 selling Italian-fabric suits at honest prices. What I buy there isn't the suit, it's the fit, and what the fit does.",
  },
  {
    path: '/media/mental-toughness/72-hour-water-fast-five-benefits',
    seo: "A three-day fast does real things to the body — some proven, some oversold. Here's the honest version, including who should never attempt one.",
    rendered: "A three-day fast does real things to the body, some proven, some oversold. Here's the honest version, including who should never attempt one.",
  },
  {
    path: '/media/mental-toughness/cognitive-bias-best-sales-tool-worst-enemy',
    seo: 'How cognitive biases destroy sales forecasts and pipeline accuracy — plus a framework to turn self-deception into competitive advantage.',
    rendered: 'How cognitive biases destroy sales forecasts and pipeline accuracy, plus a framework to turn self-deception into competitive advantage.',
  },
  {
    path: '/media/mental-toughness/sacred-hour-morning-rituals-sales-professionals',
    seo: "Motivation is unreliable. Elite sales teams build a morning ritual — the Sacred Hour — that guarantees execution regardless of mood. Here's how.",
    rendered: "Motivation is unreliable. Elite sales teams build a morning ritual, the Sacred Hour, that guarantees execution regardless of mood. Here's how.",
  },
  {
    path: '/media/strategy/fiscal-year-halftime-trends-2026',
    seo: "We're at the midpoint of the year. Here's what the first half is telling sales leaders — about AI, buyers, and an economy that rewards efficiency.",
    rendered: "We're at the midpoint of the year. Here's what the first half is telling sales leaders, about AI, buyers, and an economy that rewards efficiency.",
  },
  {
    path: '/media/strategy/fox-roku-acquisition-what-it-means-for-advertisers',
    seo: "Fox's $22B move for Roku creates a fourth pole in connected TV. For advertisers, the real story isn't reach — it's who now owns the data.",
    rendered: "Fox's $22B move for Roku creates a fourth pole in connected TV. For advertisers, the real story isn't reach, it's who now owns the data.",
  },
]

function outboundStory(): MediaStoryRecord {
  return {
    id: 'f9bebc8b-ab8a-4610-82b2-710fd71434de',
    title: OUTBOUND_H1,
    slug: 'better-outbound-digital-solutions',
    excerpt: OUTBOUND_EXCERPT,
    body: 'Outbound is not dead. Later paragraph that must not lead the snippet.',
    pillar: 'execution',
    story_type: 'article',
    source_url: null,
    source_name: null,
    featured_image_url: null,
    author: 'George Leith',
    seo_title: OUTBOUND_H1,
    seo_description: OUTBOUND_SEO,
    tags: [],
    is_published: true,
    published_at: '2026-06-01T00:00:00.000Z',
    updated_at: '2026-06-01T00:00:00.000Z',
    created_at: '2026-06-01T00:00:00.000Z',
  }
}

describe('outbound stack search snippet', () => {
  it('joins an em dash before a lowercase word with a comma', () => {
    expect(joinEmDashClause('keep — and what does not')).toBe('keep, and what does not')
    expect(joinEmDashClause('GTM 2026 — Pavilion')).toBe('GTM 2026 — Pavilion')
    expect(publishedStoryDescription({
      seo_description: OUTBOUND_SEO,
      excerpt: OUTBOUND_EXCERPT,
      body: 'A later paragraph that must not be appended.',
    })).toBe(OUTBOUND_EXCERPT)
    expect(OUTBOUND_EXCERPT).not.toMatch(/\. [a-z]/)
    expect(OUTBOUND_BROKEN).toMatch(/\. and /)
  })

  it('writes the rewritten sentence to description, og:description, and twitter:description', () => {
    expect(OUTBOUND_STACK_META_DESCRIPTION.length).toBe(151)
    expect(OUTBOUND_STACK_META_DESCRIPTION.length).toBeGreaterThanOrEqual(140)
    expect(OUTBOUND_STACK_META_DESCRIPTION.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX)
    expect(OUTBOUND_STACK_META_DESCRIPTION).not.toMatch(/[\u2013\u2014]/)
    expect(OUTBOUND_STACK_META_DESCRIPTION).not.toMatch(/\. [a-z]/)
    expect(OUTBOUND_STACK_META_DESCRIPTION).not.toMatch(/executive|tech-stack change|\$/i)
    expect(articleSearchSnippet(OUTBOUND_PATH)).toBe(OUTBOUND_STACK_META_DESCRIPTION)

    const social = mediaStorySocialMetadata(outboundStory())
    expect(social.title).toBe(OUTBOUND_TITLE)
    expect(social.description).toBe(OUTBOUND_STACK_META_DESCRIPTION)
    expect(social.openGraph?.description).toBe(OUTBOUND_STACK_META_DESCRIPTION)
    expect(social.openGraph?.title).toBe(OUTBOUND_TITLE)

    const meta = publicPageMetadata(OUTBOUND_PATH, {
      ...social,
      description: OUTBOUND_BROKEN,
      openGraph: { ...social.openGraph, description: OUTBOUND_BROKEN },
      twitter: { ...social.twitter, description: OUTBOUND_BROKEN },
    })
    expect(meta.title).toBe(OUTBOUND_TITLE)
    expect(meta.description).toBe(OUTBOUND_STACK_META_DESCRIPTION)
    expect(meta.openGraph?.title).toBe(OUTBOUND_TITLE)
    expect(meta.openGraph?.description).toBe(OUTBOUND_STACK_META_DESCRIPTION)
    expect(meta.alternates?.canonical).toBe(`https://www.evolvedpros.com${OUTBOUND_PATH}`)
    expect(meta.openGraph?.url).toBe(`https://www.evolvedpros.com${OUTBOUND_PATH}`)
    const twitter = meta.twitter as { title?: string; description?: string }
    expect(twitter.title).toBe(OUTBOUND_TITLE)
    expect(twitter.description).toBe(OUTBOUND_STACK_META_DESCRIPTION)
  })

  it('keeps the document title, canonical, and JSON-LD author and publisher', () => {
    expect(mediaStoryTitle(OUTBOUND_H1, OUTBOUND_H1, 'better-outbound-digital-solutions')).toBe(OUTBOUND_TITLE)
    expect(OUTBOUND_TITLE).toBe('Get Better at Outbound: The Digital Stack That Works')

    const document = readFileSync(resolve(here, '../../components/media/MediaStoryDocument.tsx'), 'utf8')
    expect(document).toContain('headline: story.title')
    expect(document).toContain('description: story.excerpt')
    expect(document).toContain('authorName: byline')
    expect(document).not.toContain('OUTBOUND_STACK_META_DESCRIPTION')

    const schema = articleJsonLd({
      headline: OUTBOUND_H1,
      description: OUTBOUND_EXCERPT,
      authorName: 'George Leith',
      datePublished: '2026-06-01T00:00:00.000Z',
      dateModified: '2026-06-01T00:00:00.000Z',
      url: `https://www.evolvedpros.com${OUTBOUND_PATH}`,
      image: 'https://www.evolvedpros.com/logo_horizontal_navy.png',
    })
    expect(schema.headline).toBe(OUTBOUND_H1)
    expect(schema.description).toBe(OUTBOUND_EXCERPT)
    expect(schema.url).toBe(`https://www.evolvedpros.com${OUTBOUND_PATH}`)
    expect(schema.author).toEqual({
      '@type': 'Person',
      '@id': 'https://georgeleith.com/#person',
      name: 'George Leith',
      url: 'https://georgeleith.com/',
    })
    expect(schema.publisher).toMatchObject({
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: 'Evolved Pros',
      url: 'https://www.evolvedpros.com',
    })
    expect(schema.publisher).not.toHaveProperty('sameAs')
    expect(schema.publisher).not.toHaveProperty('founder')
  })

  it('fixes the same em-dash clause on the other media descriptions and leaves the fable override', () => {
    for (const item of EM_DASH_CLAUSE_DESCRIPTIONS) {
      const rendered = publishedStoryDescription({
        seo_description: item.seo,
        excerpt: item.rendered,
        body: 'A later paragraph that must not be appended.',
      })
      expect(rendered).toBe(item.rendered)
      expect(rendered).not.toMatch(/\. [a-z]/)
      const meta = publicPageMetadata(item.path, {
        description: rendered,
        openGraph: { description: rendered },
        twitter: { description: rendered },
      })
      expect(meta.description).toBe(item.rendered)
      expect(meta.openGraph?.description).toBe(item.rendered)
      expect((meta.twitter as { description?: string } | undefined)?.description).toBe(item.rendered)
      expect(articleSearchSnippet(item.path)).toBeUndefined()
    }

    const fablePath = '/media/strategy/what-happened-to-claudes-fable-5'
    const fableSeo = "Anthropic shipped a frontier AI model, then deliberately put walls around it. The restraint is the story — and a lesson for anyone betting their craft on these tools."
    const fable = publishedStoryDescription({
      seo_description: fableSeo,
      excerpt: fableSeo,
      body: 'A later paragraph that must not be appended.',
    })
    expect(fable).not.toMatch(/\. and /)
    const fableMeta = publicPageMetadata(fablePath, {
      description: fable,
      openGraph: { description: fable },
      twitter: { description: fable },
    })
    const fableOverride = META_DESCRIPTION_OVERRIDES[fablePath]
    expect(fableMeta.description).toBe(fableOverride)
    expect(fableMeta.openGraph?.description).toBe(fableOverride)
    expect((fableMeta.twitter as { description?: string } | undefined)?.description).toBe(fableOverride)
  })
})
