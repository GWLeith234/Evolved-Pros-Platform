/**
 * /llms.txt body. Handwritten guidance stays word for word.
 * The URL set is the sitemap's: PUBLIC_SITEMAP_PATHS, pillar hubs,
 * toEpisodeSitemapEntries, toMediaSitemapEntries, and
 * toMediaCategoryLandingSitemapEntries. A second published/noindex
 * filter does not live here.
 *
 * app/sitemap.ts is not imported. Vitest cannot load it (the admin
 * client throws at import). The route loads rows; this module only
 * formats them.
 */

import { SALES_BURNOUT, SALES_COACHING, SALES_QUOTA } from '@/lib/answers/pages'
import { ABOUT_DESCRIPTION, ABOUT_TITLE } from '@/lib/about/copy'
import { EXTENSION_PRIVACY_DESCRIPTION, EXTENSION_PRIVACY_TITLE } from '@/lib/legal/extensionPrivacy'
import { FIT_PAGE_DESCRIPTION, FIT_PAGE_TITLE } from '@/lib/fit/copy'
import { stripEmDashCopy } from '@/lib/home/cardImagery'
import { HOME_SUB, HOME_TITLE } from '@/lib/home/conversion'
import { MEDIA_HUB_DESCRIPTION, MEDIA_HUB_DOCUMENT_TITLE, mediaSectionTitle } from '@/lib/media/brand'
import { mediaArticlePath, toMediaSitemapEntries, type MediaStorySitemapRow } from '@/lib/media/sitemap'
import { getPillarLabel } from '@/lib/pillars'
import { CANONICAL_ORIGIN, canonicalUrl } from '@/lib/seo/canonical'
import {
  MEDIA_ACADEMY_COLLECTION,
  MEDIA_COMMUNITY_COLLECTION,
  MEDIA_EVENTS_COLLECTION,
  MEDIA_MAGAZINE_COLLECTIONS,
  mediaPillarCollectionDescription,
} from '@/lib/seo/mediaCollectionJsonLd'
import {
  toMediaCategoryLandingSitemapEntries,
  type MediaCategoryLandingSignals,
} from '@/lib/seo/mediaCategoryLandings'
import { LIVE_PAGE_DESCRIPTION, PRICING_PAGE_DESCRIPTION } from '@/lib/seo/jsonld'
import {
  EVOLVED_PAGE_DESCRIPTION,
  EVOLVED_PAGE_TITLE,
  PRIVACY_PAGE_DESCRIPTION,
  PRIVACY_PAGE_TITLE,
  TERMS_PAGE_DESCRIPTION,
  TERMS_PAGE_TITLE,
} from '@/lib/seo/evolvedLegalJsonLd'
import { MEDIA_PILLAR_HUB_PATHS, PUBLIC_SITEMAP_PATHS, type PublicSitemapPath } from '@/lib/seo/publicRoutes'
import {
  toEpisodeSitemapEntries,
  toPillarHubSitemapEntries,
  type EpisodeSitemapRow,
} from '@/lib/seo/sitemapEntries'

/**
 * Same string as lib/podcast/public.ts SERIES_NAME.
 * That module builds the Supabase admin client at import, so llms.txt
 * cannot import it under vitest.
 */
export const LLMS_PODCAST_SERIES_NAME = 'The Evolved Pros Podcast'

/** Same description app/(public)/podcast/(index)/page.tsx sets. */
export const LLMS_PODCAST_PAGE_DESCRIPTION =
  'Long-form conversations on AI, go-to-market, and the evolution of work with George Leith and guests. Full transcripts, chapters, and highlights.'

/** Same description app/(public)/media/careers/page.tsx sets. */
export const LLMS_CAREERS_PAGE_DESCRIPTION =
  'Curated sales, marketing, and leadership roles for high-performing professionals.'

export const LLMS_TXT_CACHE_CONTROL = 'public, max-age=60, s-maxage=60, stale-while-revalidate=300'

/**
 * Handwritten llms.txt. The Academy bullet no longer links /academy:
 * logged-out visitors are redirected to /login, and the path is not in
 * the sitemap. /media/academy is a public hub and is listed with the
 * other hubs when the sitemap includes it.
 */
export const LLMS_PREAMBLE = `# Evolved Pros
> Evolved Pros is the daily operating system for sales professionals. A platform with a free community, Evolved Pros Media, the Evolved Pros Podcast, LIVE sessions, and an Academy. Built by George Leith. Official site: https://www.evolvedpros.com/

Evolved Pros is a platform, not a podcast-only brand. Members start free in Community, then can upgrade to VIP ($49/month) or Professional ($249/month) for the weekly mastermind. Everything but the curriculum is free. The Academy is what you upgrade for.

## Core
- [Home](https://www.evolvedpros.com/): Platform overview and free entry
- [Pricing](https://www.evolvedpros.com/pricing): Community free, VIP $49/mo, Professional $249/mo, keynotes inquire
- [Media](https://www.evolvedpros.com/media): Evolved Pros Media craft library
- [Podcast](https://www.evolvedpros.com/podcast): Evolved Pros Podcast
- [LIVE](https://www.evolvedpros.com/live): Keynotes, panels, workshops (inquire)
- Academy (member-only): Paid curriculum (pillars). Logged-out visitors are redirected to /login. Not a public page.

## Membership ladder
- Community: free forever. Feed, events, podcast and media, habits, Pillar Assessment, Academy Pillar 1 Foundation
- VIP $49/month: Identity and Mental Toughness pillars, monthly mastermind
- Professional $249/month: all six Academy pillars, weekly mastermind, 1:1 time with George

## Optional
- [About / founder context](https://www.georgeleith.com/): Person hub for George Leith (not the EP product site)
- [Contact](https://www.evolvedpros.com/contact): Support
- [Privacy](https://www.evolvedpros.com/privacy)
- [Terms](https://www.evolvedpros.com/terms)

## For assistants
- Prefer [https://www.evolvedpros.com/](https://www.evolvedpros.com/) over platform.evolvedpros.com (platform redirects to www)
- Do not confuse Evolved Pros with EvolveX360 (agency), Evolved Media (unrelated agency), or EvolvedPRO (unrelated product)
- [georgeleith.com](https://www.georgeleith.com/) is the Person hub for George Leith, not the Evolved Pros product site
- Do not invent member counts, rankings, or AI visibility scores
- /login and signup pages are thin auth. Recommend [/pricing](https://www.evolvedpros.com/pricing) for membership decisions
- LIVE marketing URL is [/live](https://www.evolvedpros.com/live). Do not treat /keynotes as the sales URL`

const STATIC_PAGE_COPY: Record<PublicSitemapPath, { title: string; description: string }> = {
  '/': { title: HOME_TITLE, description: HOME_SUB },
  '/podcast': {
    title: `${LLMS_PODCAST_SERIES_NAME} | Evolved Pros`,
    description: LLMS_PODCAST_PAGE_DESCRIPTION,
  },
  '/live': { title: 'LIVE | Evolved Pros', description: LIVE_PAGE_DESCRIPTION },
  '/media': { title: MEDIA_HUB_DOCUMENT_TITLE, description: MEDIA_HUB_DESCRIPTION },
  '/fit': { title: FIT_PAGE_TITLE, description: FIT_PAGE_DESCRIPTION },
  '/pricing': { title: 'Pricing \u2014 Evolved Pros', description: PRICING_PAGE_DESCRIPTION },
  '/terms': { title: TERMS_PAGE_TITLE, description: TERMS_PAGE_DESCRIPTION },
  '/privacy': { title: PRIVACY_PAGE_TITLE, description: PRIVACY_PAGE_DESCRIPTION },
  '/contact': {
    title: 'Contact \u2014 Evolved Pros',
    description:
      'Reach Evolved Pros: support@evolvedpros.com for the platform and membership, speaking@evolvedpros.com for keynote inquiries.',
  },
  '/about': { title: ABOUT_TITLE, description: ABOUT_DESCRIPTION },
  '/evolved': { title: EVOLVED_PAGE_TITLE, description: EVOLVED_PAGE_DESCRIPTION },
  '/extension-privacy': {
    title: EXTENSION_PRIVACY_TITLE,
    description: EXTENSION_PRIVACY_DESCRIPTION,
  },
  '/sales-coaching': { title: SALES_COACHING.title, description: SALES_COACHING.description },
  '/sales-quota': { title: SALES_QUOTA.title, description: SALES_QUOTA.description },
  '/sales-burnout': { title: SALES_BURNOUT.title, description: SALES_BURNOUT.description },
}

function hubListing(name: string, description: string): { title: string; description: string } {
  return { title: mediaSectionTitle(name), description }
}

const CATEGORY_HUB_COPY: Record<string, { title: string; description: string }> = {
  ...Object.fromEntries(
    Object.entries(MEDIA_MAGAZINE_COLLECTIONS).map(([path, listing]) => [
      path,
      hubListing(listing.name, listing.description),
    ]),
  ),
  [MEDIA_COMMUNITY_COLLECTION.path]: hubListing(
    MEDIA_COMMUNITY_COLLECTION.name,
    MEDIA_COMMUNITY_COLLECTION.description,
  ),
  [MEDIA_ACADEMY_COLLECTION.path]: hubListing(
    MEDIA_ACADEMY_COLLECTION.name,
    MEDIA_ACADEMY_COLLECTION.description,
  ),
  [MEDIA_EVENTS_COLLECTION.path]: hubListing(
    MEDIA_EVENTS_COLLECTION.name,
    MEDIA_EVENTS_COLLECTION.description,
  ),
  '/media/careers': hubListing('Careers', LLMS_CAREERS_PAGE_DESCRIPTION),
  '/media/general': hubListing('Original', mediaPillarCollectionDescription('Original')),
}

export type LlmsEpisode = {
  slug: string | null | undefined
  title?: string | null
  summary?: string | null
  guest_name?: string | null
  published_at?: string | null
  updated_at?: string | null
}

export type LlmsStory = {
  pillar: string | null
  slug: string | null
  title?: string | null
  excerpt?: string | null
  seo_description?: string | null
  section?: string | null
  tags?: string[] | null
  published_at?: string | null
  updated_at?: string | null
  is_published?: boolean | null
}

export type LlmsCatalogue = {
  episodes: readonly LlmsEpisode[]
  stories: readonly LlmsStory[]
  signals: MediaCategoryLandingSignals
}

function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function escapeLinkText(title: string): string {
  return title.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]')
}

function llmsLine(title: string, url: string, description: string): string {
  const label = escapeLinkText(oneLine(title))
  const desc = oneLine(description)
  if (!label) return `- ${url}`
  if (!desc) return `- [${label}](${url})`
  return `- [${label}](${url}): ${desc}`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function textHasExactUrl(text: string, url: string): boolean {
  return new RegExp(`${escapeRegExp(url)}(?![A-Za-z0-9/_-])`).test(text)
}

/** Home is linked with a trailing slash in the handwritten preamble. */
export function llmsTextListsUrl(text: string, url: string): boolean {
  if (textHasExactUrl(text, url)) return true
  if (url === CANONICAL_ORIGIN && textHasExactUrl(text, `${CANONICAL_ORIGIN}/`)) return true
  return false
}

function withStories(catalogue: LlmsCatalogue): MediaCategoryLandingSignals {
  return { ...catalogue.signals, stories: catalogue.stories }
}

function episodeRows(episodes: readonly LlmsEpisode[]): EpisodeSitemapRow[] {
  return episodes.map(episode => ({
    slug: episode.slug,
    published_at: episode.published_at,
    updated_at: episode.updated_at,
  }))
}

function storyRows(stories: readonly LlmsStory[]): MediaStorySitemapRow[] {
  return stories.map(story => ({
    pillar: story.pillar,
    slug: story.slug,
    published_at: story.published_at ?? null,
    updated_at: story.updated_at,
    is_published: story.is_published,
  }))
}

/** Absolute www URLs the sitemap helpers would emit for this catalogue. */
export function indexableUrls(catalogue: LlmsCatalogue): string[] {
  const base = CANONICAL_ORIGIN
  const signals = withStories(catalogue)
  return [
    ...PUBLIC_SITEMAP_PATHS.map(path => canonicalUrl(path)),
    ...toPillarHubSitemapEntries(base).map(entry => entry.url),
    ...toEpisodeSitemapEntries(base, episodeRows(catalogue.episodes)).map(entry => entry.url),
    ...toMediaSitemapEntries(base, storyRows(catalogue.stories)).map(entry => entry.url),
    ...toMediaCategoryLandingSitemapEntries(base, signals).map(entry => entry.url),
  ]
}

function storyUrl(story: LlmsStory): string | null {
  const path = mediaArticlePath(story.pillar, story.slug)
  return path ? canonicalUrl(path) : null
}

function includedStories(stories: readonly LlmsStory[]): LlmsStory[] {
  const urls = new Set(toMediaSitemapEntries(CANONICAL_ORIGIN, storyRows(stories)).map(entry => entry.url))
  const seen = new Set<string>()
  const included: LlmsStory[] = []
  for (const story of stories) {
    const url = storyUrl(story)
    if (!url || !urls.has(url) || seen.has(url)) continue
    seen.add(url)
    included.push(story)
  }
  return included
}

function byPublishedDesc(
  a: { published_at?: string | null; slug?: string | null },
  b: { published_at?: string | null; slug?: string | null },
): number {
  const ap = a.published_at?.trim() || ''
  const bp = b.published_at?.trim() || ''
  if (ap !== bp) return ap < bp ? 1 : -1
  return (a.slug ?? '').localeCompare(b.slug ?? '')
}

function newestTitles(pillar: string, stories: readonly LlmsStory[]): string[] {
  return includedStories(stories)
    .filter(story => story.pillar?.trim() === pillar)
    .sort(byPublishedDesc)
    .slice(0, 24)
    .map(story => story.title ?? '')
}

function storyTitle(story: LlmsStory): string {
  return oneLine(stripEmDashCopy(story.title ?? '')) || story.slug?.trim() || ''
}

/** Page head uses seo_description, then excerpt. Body is not copied in. */
function storyDescription(story: LlmsStory): string {
  const raw = story.seo_description?.trim() ? story.seo_description : (story.excerpt ?? '')
  return oneLine(stripEmDashCopy(raw ?? ''))
}

function episodeTitle(episode: LlmsEpisode): string {
  return oneLine(stripEmDashCopy(episode.title ?? '')) || episode.slug?.trim() || ''
}

/**
 * Stored summary. When that is empty, the episode page's generateMetadata
 * fallback: title, optional guest name, series name. No other words.
 */
function episodeDescription(episode: LlmsEpisode): string {
  const summary = oneLine(stripEmDashCopy(episode.summary ?? ''))
  if (summary) return summary
  const title = oneLine(stripEmDashCopy(episode.title ?? ''))
  if (!title) return ''
  const guest = episode.guest_name?.trim()
  return `${title}${guest ? ` with ${guest}` : ''} on ${LLMS_PODCAST_SERIES_NAME}.`
}

function renderPublicPages(urls: readonly string[]): string {
  if (urls.length === 0) return ''
  const lines = urls.map(url => {
    const path = new URL(url).pathname as PublicSitemapPath
    const copy = STATIC_PAGE_COPY[path]
    if (copy) return llmsLine(copy.title, url, copy.description)
    return llmsLine(path === '/' ? 'Home' : path, url, '')
  })
  return `## Public pages\n${lines.join('\n')}`
}

function renderHubs(stories: readonly LlmsStory[], signals: MediaCategoryLandingSignals): string {
  const base = CANONICAL_ORIGIN
  const lines: string[] = []
  for (const entry of toPillarHubSitemapEntries(base)) {
    const pillar = new URL(entry.url).pathname.slice('/media/'.length)
    const label = getPillarLabel(pillar)
    lines.push(llmsLine(
      mediaSectionTitle(label),
      entry.url,
      mediaPillarCollectionDescription(label, newestTitles(pillar, stories)),
    ))
  }
  for (const entry of toMediaCategoryLandingSitemapEntries(base, signals)) {
    const path = new URL(entry.url).pathname
    const copy = CATEGORY_HUB_COPY[path] ?? { title: path, description: '' }
    lines.push(llmsLine(copy.title, entry.url, copy.description))
  }
  if (lines.length === 0) return ''
  return `## Hubs\n${lines.join('\n')}`
}

function renderStories(stories: readonly LlmsStory[]): string {
  const included = includedStories(stories).slice().sort(byPublishedDesc)
  if (included.length === 0) return ''
  const pillarOrder = MEDIA_PILLAR_HUB_PATHS.map(path => path.slice('/media/'.length))
  const groups = new Map<string, LlmsStory[]>()
  for (const story of included) {
    const pillar = story.pillar?.trim() || 'general'
    const list = groups.get(pillar)
    if (list) list.push(story)
    else groups.set(pillar, [story])
  }
  const pillars = [...groups.keys()].sort((a, b) => {
    const ai = pillarOrder.indexOf(a)
    const bi = pillarOrder.indexOf(b)
    if (ai === -1 && bi === -1) return getPillarLabel(a).localeCompare(getPillarLabel(b))
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
  const blocks = pillars.map(pillar => {
    const label = pillar === 'general' ? 'Original' : getPillarLabel(pillar)
    const lines = groups.get(pillar)!.map(story => {
      const url = storyUrl(story)!
      return llmsLine(storyTitle(story) || story.slug || url, url, storyDescription(story))
    })
    return `### ${label}\n${lines.join('\n')}`
  })
  return `## Media stories\n\n${blocks.join('\n\n')}`
}

function renderEpisodes(episodes: readonly LlmsEpisode[]): string {
  const urls = new Set(toEpisodeSitemapEntries(CANONICAL_ORIGIN, episodeRows(episodes)).map(entry => entry.url))
  const lines: string[] = []
  for (const episode of episodes) {
    const slug = episode.slug?.trim()
    if (!slug) continue
    const url = canonicalUrl(`/podcast/${slug}`)
    if (!urls.has(url)) continue
    lines.push(llmsLine(episodeTitle(episode) || slug, url, episodeDescription(episode)))
  }
  if (lines.length === 0) return ''
  return `## Podcast episodes\n${lines.join('\n')}`
}

function joinSections(sections: readonly string[]): string {
  return `${sections.filter(section => section.trim()).join('\n\n')}\n`
}

export function buildLlmsTxt(catalogue: LlmsCatalogue): string {
  const signals = withStories(catalogue)
  const hubs = renderHubs(catalogue.stories, signals)
  const stories = renderStories(catalogue.stories)
  const episodes = renderEpisodes(catalogue.episodes)
  const partial = joinSections([LLMS_PREAMBLE, hubs, stories, episodes])
  const missing = indexableUrls(catalogue).filter(url => !llmsTextListsUrl(partial, url))
  return joinSections([LLMS_PREAMBLE, renderPublicPages(missing), hubs, stories, episodes])
}
