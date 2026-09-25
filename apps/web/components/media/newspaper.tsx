/**
 * Shared Soo/TT newspaper modules for Media section landings and articles.
 * Same grammar as Phase 1 home (MediaPortalClient): thumbs, Featured 2-up,
 * bordered Latest rows, Most Read, Podcast. Tokens live on .ep-media-home.
 */
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { MediaPartnerSlot, MediaScrollRect } from '@/components/media/MediaPartnerSlot'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { layoutArticleBody, splitHtmlBlocks, type ArticleChunk } from '@/lib/ads/rhythm'
import { articleMidRectBreaks } from '@/lib/media/scrollInventory'
import { getPillarLabel } from '@/lib/pillars'
import { MEDIA_ON_AIR, moreInLabel, popularStories } from '@/lib/media/desk'
import { BriefSignup } from '@/components/media/BriefSignup'
import { mediaStoryHref } from '@/lib/media/paths'
import {
  episodeRailStill,
  episodeWatchHref,
  episodeWatchIsExternal,
  formatRailDuration,
  type MediaRailEpisode,
} from '@/lib/media/podcastRail'
import { mediaRailStillObjectPosition } from '@/lib/podcast/stillUrl'
import {
  featuredHeroByline,
  MEDIA_STORY_THUMB_RATIO,
  resolveStoryArtUrl,
  storyArtImgClass,
  storyThumbIntrinsic,
} from '@/lib/media/storyArt'

export type NewspaperStory = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  pillar: string | null
  story_type?: string | null
  featured_image_url: string | null
  author: string | null
  published_at: string | null
  body: string | null
  views?: number | null
}

export function newspaperStoryHref(story: Pick<NewspaperStory, 'pillar' | 'slug'>): string {
  return mediaStoryHref(story.pillar, story.slug)
}

export function newspaperReadTime(body: string | null | undefined): string {
  if (!body) return '1 min'
  return `${Math.max(1, Math.round(body.split(/\s+/).length / 200))} min`
}

export function newspaperReadMinutes(body: string | null | undefined): number {
  if (!body) return 1
  return Math.max(1, Math.ceil(body.split(/\s+/).length / 200))
}

export function newspaperFormatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function newspaperFormatLongDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function tagLabelForStory(story: NewspaperStory): string {
  if (story.pillar) {
    const label = getPillarLabel(story.pillar)
    if (label) return label
  }
  return story.story_type ? story.story_type.toUpperCase() : 'EVOLVED'
}

function titleClamp(lines: 2 | 3): CSSProperties {
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: lines,
    overflow: 'hidden',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  }
}

export function NewspaperThumb({
  story,
  ratio = MEDIA_STORY_THUMB_RATIO,
  priority = false,
}: {
  story: Pick<NewspaperStory, 'featured_image_url'>
  ratio?: string
  priority?: boolean
}) {
  const src = resolveStoryArtUrl(story.featured_image_url)
  const size = storyThumbIntrinsic(priority)
  return (
    <div
      className="ep-media-thumb"
      data-media-thumb={src ? 'art' : 'empty'}
      style={{ aspectRatio: ratio }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size.width}
          height={size.height}
          decoding="async"
          loading={priority ? undefined : 'lazy'}
          {...(priority ? { fetchpriority: 'high' } : {})}
          className={storyArtImgClass(story.featured_image_url)}
        />
      ) : (
        <div className="ep-media-thumb-fallback" aria-hidden="true">
          <span className="ep-media-thumb-fallback-mark">EP</span>
        </div>
      )}
    </div>
  )
}

export function NewspaperKicker({ story }: { story: NewspaperStory }) {
  return <span className="ep-media-kicker">{tagLabelForStory(story)}</span>
}

export function NewspaperByline({
  story,
  featured = false,
}: {
  story: NewspaperStory
  featured?: boolean
}) {
  const meta = (
    <>
      {featuredHeroByline(story)}
      {story.published_at ? ` · ${newspaperFormatDate(story.published_at)}` : ''}
      {` · ${newspaperReadTime(story.body)} read`}
    </>
  )
  if (featured) {
    return (
      <p
        suppressHydrationWarning
        className="ep-media-meta ed-featured-meta-byline"
        data-featured-byline="plain"
      >
        {meta}
      </p>
    )
  }
  return (
    <p suppressHydrationWarning className="ep-media-meta">
      {meta}
    </p>
  )
}

export function NewspaperDualHero({
  lede,
  secondary,
  mini = false,
}: {
  lede: NewspaperStory | null
  secondary: NewspaperStory | null
  mini?: boolean
}) {
  return (
    <div
      className={mini ? 'ep-media-dual-hero ep-media-dual-hero--mini' : 'ep-media-dual-hero'}
      data-media-module="dual-hero"
    >
      {lede ? (
        <Link href={newspaperStoryHref(lede)} className="ep-media-lede">
          <NewspaperThumb story={lede} priority />
          <div className="ep-media-lede-copy ed-featured-meta">
            <NewspaperKicker story={lede} />
            <h2 className="ep-media-lede-title">{lede.title}</h2>
            {lede.excerpt ? <p className="ep-media-lede-dek">{lede.excerpt}</p> : null}
            <NewspaperByline story={lede} featured />
          </div>
        </Link>
      ) : (
        <div className="ep-media-empty">No published stories yet.</div>
      )}
      {secondary ? (
        <Link href={newspaperStoryHref(secondary)} className="ep-media-secondary">
          <NewspaperThumb story={secondary} />
          <div className="ep-media-secondary-copy">
            <NewspaperKicker story={secondary} />
            <h3 className="ep-media-secondary-title" style={titleClamp(3)}>
              {secondary.title}
            </h3>
            <NewspaperByline story={secondary} />
          </div>
        </Link>
      ) : null}
    </div>
  )
}

export function NewspaperFeaturedGrid({ stories }: { stories: NewspaperStory[] }) {
  if (stories.length === 0) return null
  return (
    <section className="ep-media-featured" data-media-module="featured-grid">
      <div className="ep-media-module-head">
        <h2>Featured</h2>
      </div>
      <div className="ep-media-featured-grid">
        {stories.map(story => (
          <Link key={story.id} href={newspaperStoryHref(story)} className="ep-media-feature-card">
            <NewspaperThumb story={story} />
            <div className="ep-media-feature-copy">
              <NewspaperKicker story={story} />
              <h3 style={titleClamp(2)}>{story.title}</h3>
              <NewspaperByline story={story} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function NewspaperLatestRail({
  stories,
  title = 'Latest',
  moreHref,
  moreLabel,
  insertSponsoredAt,
  midRectAt,
  midRectAds,
}: {
  stories: NewspaperStory[]
  title?: string
  moreHref?: string
  moreLabel?: string
  insertSponsoredAt?: number
  midRectAt?: readonly number[]
  midRectAds?: ReadonlyArray<SponsorAd | null | undefined>
}) {
  if (stories.length === 0) return null
  return (
    <section className="ep-media-latest" data-media-module="latest-list">
      <div className="ep-media-module-head">
        <h2>{title}</h2>
        {moreHref && moreLabel ? <Link href={moreHref}>{moreLabel}</Link> : null}
      </div>
      <ul className="ep-media-latest-list">
        {stories.map((story, index) => (
          <li key={story.id}>
            <Link href={newspaperStoryHref(story)} className="ep-media-list-row">
              <NewspaperThumb story={story} />
              <div>
                <NewspaperKicker story={story} />
                <h3 style={titleClamp(2)}>{story.title}</h3>
                <NewspaperByline story={story} />
              </div>
            </Link>
            {insertSponsoredAt != null && index === insertSponsoredAt ? (
              <MediaPartnerSlot kind="sponsored-row" locationId="media-sponsored-1" />
            ) : null}
            {midRectAt?.includes(index) ? (
              <MediaScrollRect
                ad={midRectAds?.[midRectAt.indexOf(index)] ?? null}
                locationId={`media-latest-rect-${index}`}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function mergeHtmlChunks<A>(chunks: ArticleChunk<A>[]): ArticleChunk<A>[] {
  const out: ArticleChunk<A>[] = []
  for (const chunk of chunks) {
    const last = out[out.length - 1]
    if (chunk.kind === 'html' && last?.kind === 'html') {
      last.html += chunk.html
    } else {
      out.push(chunk.kind === 'html' ? { kind: 'html', html: chunk.html } : chunk)
    }
  }
  return out
}

export function newspaperArticleChunks<A>(
  html: string,
  ads: ReadonlyArray<A | null | undefined>,
): ArticleChunk<A | null>[] {
  const blocks = splitHtmlBlocks(html)
  const breaks = articleMidRectBreaks(blocks.length)
  const padded = breaks.map((_, i) => ads[i] ?? null)
  return mergeHtmlChunks(layoutArticleBody(blocks, padded, breaks))
}

export function NewspaperArticleBody({
  html,
  ads,
}: {
  html: string
  ads: ReadonlyArray<SponsorAd | null | undefined>
}) {
  const chunks = newspaperArticleChunks(html, ads)
  return (
    <div className="media-prose" data-media-article-body>
      {chunks.map((chunk, i) =>
        chunk.kind === 'html' ? (
          <div key={`html-${i}`} dangerouslySetInnerHTML={{ __html: chunk.html }} />
        ) : (
          <MediaScrollRect
            key={`rect-${i}`}
            ad={chunk.ad}
            locationId={`media-article-mid-${i}`}
          />
        ),
      )}
    </div>
  )
}

export function NewspaperOnAir() {
  return (
    <section className="ep-media-rail-card" data-media-module="on-air">
      <div className="ep-media-rail-head">
        <h2>On Air</h2>
      </div>
      <div className="ep-media-on-air">
        {MEDIA_ON_AIR.map(link => (
          <Link key={link.label} href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  )
}

export function NewspaperMostRead({ stories }: { stories: NewspaperStory[] }) {
  const popular = popularStories(stories, 5)
  if (popular.length === 0) return null
  return (
    <section className="ep-media-rail-card" data-media-module="most-read">
      <div className="ep-media-rail-head">
        <h2>Most Read</h2>
      </div>
      <ol className="ep-media-most-read">
        {popular.map((story, i) => (
          <li key={story.id}>
            <Link href={newspaperStoryHref(story)}>
              <span className="ep-media-most-read-n" aria-hidden="true">
                {i + 1}
              </span>
              <span>
                <span className="ep-media-kicker">{tagLabelForStory(story)}</span>
                <span className="ep-media-most-read-title" style={titleClamp(2)}>
                  {story.title}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

/**
 * SPRINT M - the rail brief module. Kept as a named export so existing call
 * sites keep working; the body is now a real capture form, not a /podcast link.
 */
export function NewspaperBriefCta() {
  return <BriefSignup variant="rail" />
}

// NewspaperSoftVipCta is gone (SPRINT M). It was a static "Join Community /
// See VIP" block shown to everyone, including people who already pay. Its
// replacement is <ArticleEndCta />, which asks who is reading first and keeps
// the .ep-media-soft-cta chrome.

export function NewspaperPodcast({
  episodes,
  title = 'From the Podcast',
  limit = 2,
}: {
  episodes: MediaRailEpisode[]
  title?: string
  limit?: number
}) {
  const rows = episodes.slice(0, limit)
  if (rows.length === 0) return null
  return (
    <section className="ep-media-podcast" data-media-module="from-the-podcast" data-media-podcast-rail>
      <div className="ep-media-module-head">
        <h2>{title}</h2>
        <Link href="/podcast">All episodes</Link>
      </div>
      <div className="ep-media-podcast-grid ep-media-podcast-grid--article">
        {rows.map(ep => {
          const href = episodeWatchHref(ep)
          const external = episodeWatchIsExternal(href)
          const still = episodeRailStill(ep)
          const duration = formatRailDuration(ep.duration_seconds)
          return (
            <a
              key={ep.id}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              data-media-podcast-row
              className="ep-media-podcast-card"
            >
              <div className="ep-media-podcast-still" data-media-thumb={still ? 'art' : 'empty'}>
                {still ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={still}
                    alt=""
                    width={320}
                    height={180}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: mediaRailStillObjectPosition({ slug: ep.slug, episode_number: ep.episode_number, stillUrl: still }, '50% 12%') }}
                  />
                ) : (
                  <div className="ep-media-thumb-fallback" aria-hidden="true">
                    <span className="ep-media-thumb-fallback-mark">EP</span>
                  </div>
                )}
              </div>
              <p className="ep-media-kicker">Episode {ep.episode_number}</p>
              <h3>{ep.title}</h3>
              {duration ? <p className="ep-media-meta">{duration}</p> : null}
            </a>
          )
        })}
      </div>
    </section>
  )
}

export function NewspaperMoreInSection({
  label,
  href,
  stories,
}: {
  label: string
  href: string
  stories: NewspaperStory[]
}) {
  if (stories.length === 0) return null
  return (
    <section className="ep-media-more-section" data-media-module="more-in-section">
      <div className="ep-media-module-head">
        <h2>{moreInLabel(label)}</h2>
        <Link href={href}>See all</Link>
      </div>
      <ul className="ep-media-latest-list">
        {stories.slice(0, 6).map(story => (
          <li key={story.id}>
            <Link href={newspaperStoryHref(story)} className="ep-media-list-row">
              <NewspaperThumb story={story} />
              <div>
                <NewspaperKicker story={story} />
                <h3 style={titleClamp(2)}>{story.title}</h3>
                <NewspaperByline story={story} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
