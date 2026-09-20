import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { marked } from 'marked'
import { sanitizeMediaHtml } from '@/lib/security/html'
import { adminClient } from '@/lib/supabase/admin'
import { getPillarLabel } from '@/lib/pillars'
import { ArticleShareBar } from './ArticleShareBar'
import { MediaPartnerSlot } from '@/components/media/MediaPartnerSlot'
import {
  NewspaperArticleBody,
  NewspaperLatestRail,
  NewspaperMoreInSection,
  NewspaperMostRead,
  NewspaperPodcast,
  NewspaperSoftVipCta,
  newspaperFormatLongDate,
  newspaperReadMinutes,
  type NewspaperStory,
} from '@/components/media/newspaper'
import type { MediaRailEpisode } from '@/lib/media/podcastRail'
import { MEDIA_BRAND, mediaStoryTitle } from '@/lib/media/brand'
import {
  lockedArticleByline,
  resolveStoryArtUrl,
  storyArtImgClass,
} from '@/lib/media/storyArt'
import { stripEmDashCopy } from '@/lib/home/cardImagery'
import { CANONICAL_ORIGIN, DEFAULT_OG_IMAGE, canonicalUrl, publicPageMetadata } from '@/lib/seo/canonical'
import { mediaMustCite } from '@/lib/seo/mustCite'
import { getActivePlatformAds } from '@/lib/cache/shared'
import { pickArticleAds } from '@/lib/sponsors/partners'
import { adMatchesSurface } from '@/lib/ads/iab'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { getPublishedMediaStoriesForHub } from '@/lib/media/public'

export const revalidate = 3600
export const dynamicParams = true

interface Story {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body: string | null
  pillar: string | null
  story_type: string
  source_url: string | null
  source_name: string | null
  featured_image_url: string | null
  author: string | null
  seo_title: string | null
  seo_description: string | null
  tags: string[]
  is_published: boolean
  published_at: string | null
  updated_at: string | null
}

async function fetchStory(pillar: string, slug: string): Promise<Story | null> {
  const query = adminClient
    .from('media_stories')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
  const { data } = pillar === 'general'
    ? await query.is('pillar', null).maybeSingle()
    : await query.eq('pillar', pillar).maybeSingle()
  return (data as Story | null)
}

function markBottomLine(html: string): string {
  return html.replace(
    /<h2([^>]*)>\s*The Bottom Line\s*<\/h2>/i,
    '<h2$1 class="ep-media-bottom-line">The Bottom Line</h2>',
  )
}

export async function generateStaticParams() {
  const { data } = await adminClient
    .from('media_stories')
    .select('pillar, slug')
    .eq('is_published', true)
  return (data ?? [])
    .filter(s => s.slug)
    .map(s => ({ pillar: s.pillar ? String(s.pillar) : 'general', slug: String(s.slug) }))
}

export async function generateMetadata(
  { params }: { params: { pillar: string; slug: string } },
): Promise<Metadata> {
  const story = await fetchStory(params.pillar, params.slug)
  if (!story) return {}

  const title = stripEmDashCopy(story.seo_title || mediaStoryTitle(story.title))
  const description = stripEmDashCopy(story.seo_description || story.excerpt || '')
  const image = resolveStoryArtUrl(story.featured_image_url) || DEFAULT_OG_IMAGE
  const byline = lockedArticleByline(story)

  return publicPageMetadata(`/media/${params.pillar}/${params.slug}`, {
    title,
    description,
    openGraph: {
      title, description, type: 'article',
      publishedTime: story.published_at ?? undefined,
      modifiedTime: story.updated_at ?? undefined,
      authors: [byline],
      tags: story.tags ?? [],
      images: [{ url: image, width: 1200, height: 630, alt: story.title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  })
}

export default async function StoryPage({
  params,
}: {
  params: { pillar: string; slug: string }
}) {
  const story = await fetchStory(params.pillar, params.slug)
  if (!story) return notFound()

  if (story.story_type === 'redirect' && story.source_url) {
    redirect(story.source_url)
  }

  const minutes = newspaperReadMinutes(story.body)
  const rawHtml = story.body ? sanitizeMediaHtml(await marked.parse(story.body)) : ''
  const html = markBottomLine(rawHtml)
  const byline = lockedArticleByline(story)
  const isOriginal = !story.pillar
  const pLabel = isOriginal ? 'Original' : getPillarLabel(story.pillar)
  const articleUrl = canonicalUrl(`/media/${params.pillar}/${params.slug}`)
  const cite = mediaMustCite(params.pillar, params.slug)
  const artSrc = resolveStoryArtUrl(story.featured_image_url)
  const sectionHref = `/media/${params.pillar}`

  let articleAds: ReturnType<typeof pickArticleAds> = { sidebar: null, inBody: [], related: null }
  try {
    const catalog = ((await getActivePlatformAds()) as SponsorAd[]).filter(a => adMatchesSurface(a, 'media'))
    articleAds = pickArticleAds(catalog)
  } catch {
    // Partner slots still render empty geometry when the catalog is down.
  }

  const hubStories = await getPublishedMediaStoriesForHub()
  const others = hubStories.filter(s => s.id !== story.id)
  const moreInSection = others
    .filter(s => (params.pillar === 'general' ? !s.pillar : s.pillar === params.pillar))
    .slice(0, 6)
  const latestOnMedia = others.slice(0, 6)

  let episodes: MediaRailEpisode[] = []
  try {
    const { data } = await adminClient
      .from('episodes')
      .select('id, episode_number, title, slug, thumbnail_url, guest_image_url, youtube_url, duration_seconds')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(2)
    episodes = (data ?? []) as MediaRailEpisode[]
  } catch {
    // episodes table may not exist yet
  }

  const articleSchema = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: story.title, description: story.excerpt,
    author: { '@type': 'Person', name: byline },
    publisher: { '@type': 'Organization', name: 'Evolved Pros', url: CANONICAL_ORIGIN },
    datePublished: story.published_at, dateModified: story.updated_at,
    url: articleUrl, image: artSrc || DEFAULT_OG_IMAGE,
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Media', item: canonicalUrl('/media') },
      { '@type': 'ListItem', position: 2, name: pLabel, item: canonicalUrl(sectionHref) },
      { '@type': 'ListItem', position: 3, name: story.title.slice(0, 80) },
    ],
  }

  return (
    <div className="ep-media-home ep-media-article" data-media-surface="article" data-media-comments="off">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="ep-media-home-inner">
        <nav className="ep-media-breadcrumb" aria-label="Breadcrumb">
          <Link href="/media">Media</Link>
          <span aria-hidden="true">/</span>
          <Link href={sectionHref}>{pLabel}</Link>
          <span aria-hidden="true">/</span>
          <span>{story.title.length > 48 ? `${story.title.slice(0, 48)}...` : story.title}</span>
        </nav>

        <div className="ep-media-article-grid">
          <article className="ep-media-article-main">
            <span className="ep-media-kicker">{pLabel}</span>
            <h1 className="ep-media-article-title">{story.title}</h1>
            <p className="ep-media-meta ep-media-article-byline" data-featured-byline="plain">
              {newspaperFormatLongDate(story.published_at)}
              {' · '}
              {minutes} min read
              {' · '}
              {byline}
            </p>

            <ArticleShareBar articleUrl={articleUrl} articleTitle={story.title} />

            <figure
              className="ep-media-article-art"
              data-media-thumb={artSrc ? 'hero' : 'empty'}
              {...(artSrc ? {} : { 'data-media-thumb-empty': 'true' })}
            >
              {artSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={artSrc}
                  alt=""
                  width={1280}
                  height={853}
                  decoding="async"
                  className={storyArtImgClass(story.featured_image_url)}
                />
              ) : (
                <div className="ep-media-thumb-fallback" aria-hidden="true" />
              )}
            </figure>

            {story.story_type === 'pioneer_spin' && story.source_name ? (
              <p className="ep-media-article-source">
                Inspired by{' '}
                {story.source_url ? (
                  <a href={story.source_url} target="_blank" rel="noopener noreferrer">
                    {story.source_name}
                  </a>
                ) : (
                  story.source_name
                )}
              </p>
            ) : null}

            {cite ? (
              <p id="must-cite" className="ep-media-must-cite">
                {cite.copy}
              </p>
            ) : null}

            <NewspaperArticleBody html={html} ads={articleAds.inBody} />

            <div className="ep-media-article-slot">
              <MediaPartnerSlot
                kind="article-inline"
                ad={articleAds.related}
                locationId="media-article-inline"
              />
            </div>

            <NewspaperSoftVipCta />
          </article>

          <aside className="ep-media-home-rail">
            <NewspaperMostRead stories={others as NewspaperStory[]} />
            <div className="ep-media-rail-slot media-sticky-rail">
              <MediaPartnerSlot
                kind="rail-half"
                ad={articleAds.sidebar}
                locationId="media-article-rail"
              />
            </div>
          </aside>
        </div>

        <NewspaperMoreInSection
          label={pLabel}
          href={sectionHref}
          stories={moreInSection as NewspaperStory[]}
        />

        <NewspaperLatestRail
          stories={latestOnMedia as NewspaperStory[]}
          title="Latest on Media"
          moreHref="/media"
          moreLabel={`More from ${MEDIA_BRAND}`}
        />

        <NewspaperPodcast episodes={episodes} title="From the Podcast" limit={2} />
      </div>
    </div>
  )
}
