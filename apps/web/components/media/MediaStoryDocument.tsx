import Link from 'next/link'
import { marked } from 'marked'
import { sanitizeMediaHtml } from '@/lib/security/html'
import { adminClient } from '@/lib/supabase/admin'
import { getPillarLabel } from '@/lib/pillars'
import { ArticleShareBar } from '@/app/(public)/media/[pillar]/[slug]/ArticleShareBar'
import { MediaPartnerSlot } from '@/components/media/MediaPartnerSlot'
import { BriefSignup } from '@/components/media/BriefSignup'
import { ArticleEndCta } from '@/components/media/ArticleEndCta'
import {
  NewspaperArticleBody,
  NewspaperLatestRail,
  NewspaperMoreInSection,
  NewspaperMostRead,
  NewspaperPodcast,
  newspaperFormatLongDate,
  newspaperReadMinutes,
  type NewspaperStory,
} from '@/components/media/newspaper'
import type { MediaRailEpisode } from '@/lib/media/podcastRail'
import { MEDIA_BRAND } from '@/lib/media/brand'
import { lockedArticleByline, resolveStoryArtUrl, storyArtImgClass } from '@/lib/media/storyArt'
import type { MediaStoryRecord } from '@/lib/media/storyRecord'
import { CANONICAL_ORIGIN, DEFAULT_OG_IMAGE, canonicalUrl } from '@/lib/seo/canonical'
import { mediaMustCite } from '@/lib/seo/mustCite'
import { getActivePlatformAds } from '@/lib/cache/shared'
import { pickArticleAds } from '@/lib/sponsors/partners'
import { adMatchesSurface } from '@/lib/ads/iab'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { getPublishedMediaStoriesForHub } from '@/lib/media/public'
import { heroImageCreditForUrl } from '@/lib/media/heroPrompt'

function markBottomLine(html: string): string {
  return html.replace(
    /<h2([^>]*)>\s*The Bottom Line\s*<\/h2>/i,
    '<h2$1 class="ep-media-bottom-line">The Bottom Line</h2>',
  )
}

/**
 * The public article: hero, byline, body, rails, and JSON-LD.
 * The draft preview route renders this same component.
 */
export async function MediaStoryDocument({
  story,
  routePillar,
  routeSlug,
}: {
  story: MediaStoryRecord
  routePillar: string
  routeSlug: string
}) {
  const minutes = newspaperReadMinutes(story.body)
  const rawHtml = story.body ? sanitizeMediaHtml(await marked.parse(story.body)) : ''
  const html = markBottomLine(rawHtml)
  const byline = lockedArticleByline(story)
  const isOriginal = !story.pillar
  const pLabel = isOriginal ? 'Original' : getPillarLabel(story.pillar)
  const articleUrl = canonicalUrl(`/media/${routePillar}/${routeSlug}`)
  const cite = mediaMustCite(routePillar, routeSlug)
  const artSrc = resolveStoryArtUrl(story.featured_image_url)
  const artCredit = heroImageCreditForUrl(story.featured_image_url)
  const sectionHref = `/media/${routePillar}`

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
    .filter(s => (routePillar === 'general' ? !s.pillar : s.pillar === routePillar))
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

            {artSrc ? (
              <figure className="ep-media-article-art">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artSrc}
                  alt=""
                  width={1280}
                  height={720}
                  decoding="async"
                  className={storyArtImgClass(story.featured_image_url)}
                />
                {artCredit ? <figcaption>{artCredit}</figcaption> : null}
              </figure>
            ) : null}

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

            {story.story_type === 'redirect' && story.source_url ? (
              <p className="ep-media-article-source">
                Live page redirects to{' '}
                <a href={story.source_url} target="_blank" rel="noopener noreferrer">
                  {story.source_url}
                </a>
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

            <BriefSignup variant="inline" source="media-article" />
            <ArticleEndCta />
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
