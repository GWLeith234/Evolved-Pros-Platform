'use client'

import { useMemo, type CSSProperties } from 'react'
import Link from 'next/link'
import { MediaPartnerSlot, MediaScrollRect } from '@/components/media/MediaPartnerSlot'
import { homeMidRectBands, latestMidRectIndexes } from '@/lib/media/scrollInventory'
import { getPillarLabel } from '@/lib/pillars'
import {
  MEDIA_ON_AIR,
  moreInLabel,
  popularStories,
  splitHubDesk,
} from '@/lib/media/desk'
import {
  episodeRailStill,
  episodeWatchHref,
  episodeWatchIsExternal,
  formatRailDuration,
  type MediaRailEpisode,
} from '@/lib/media/podcastRail'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { featuredHeroByline, resolveStoryArtUrl, storyArtImgClass } from '@/lib/media/storyArt'

export interface MediaStory {
  id: string
  title: string
  slug: string
  excerpt: string | null
  pillar: string | null
  story_type: string
  featured_image_url: string | null
  author: string | null
  published_at: string | null
  body: string | null
  views: number
}

export type Episode = MediaRailEpisode & {
  published_at?: string | null
}

interface MediaPortalClientProps {
  stories: MediaStory[]
  episodes: Episode[]
  sidebarAd?: SponsorAd | null
  inFeedAds?: SponsorAd[]
}

function tagLabelForStory(story: MediaStory): string {
  if (story.pillar) {
    const label = getPillarLabel(story.pillar)
    if (label) return label
  }
  return story.story_type ? story.story_type.toUpperCase() : 'EVOLVED'
}

function readTime(body: string | null): string {
  if (!body) return '1 min'
  return `${Math.max(1, Math.round(body.split(/\s+/).length / 200))} min`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function storyUrl(story: MediaStory): string {
  return `/media/${story.pillar ?? 'general'}/${story.slug}`
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

function StoryThumb({
  story,
  ratio,
  priority = false,
}: {
  story: MediaStory
  ratio: string
  priority?: boolean
}) {
  const src = resolveStoryArtUrl(story.featured_image_url)
  return (
    <div className="ep-media-thumb" style={{ aspectRatio: ratio }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={priority ? 1280 : 320}
          height={priority ? 720 : 214}
          decoding="async"
          loading={priority ? undefined : 'lazy'}
          {...(priority ? { fetchpriority: 'high' } : {})}
          className={storyArtImgClass(story.featured_image_url)}
        />
      ) : (
        <div className="ep-media-thumb-fallback" />
      )}
    </div>
  )
}

function PillarKicker({ story }: { story: MediaStory }) {
  return <span className="ep-media-kicker">{tagLabelForStory(story)}</span>
}

function StoryByline({
  story,
  featured = false,
}: {
  story: MediaStory
  featured?: boolean
}) {
  const meta = (
    <>
      {featured ? featuredHeroByline(story) : (story.author ?? 'George Leith')}
      {story.published_at ? ` · ${formatDate(story.published_at)}` : ''}
      {` · ${readTime(story.body)} read`}
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

function DualHero({
  lede,
  secondary,
}: {
  lede: MediaStory | null
  secondary: MediaStory | null
}) {
  return (
    <div className="ep-media-dual-hero" data-media-module="dual-hero">
      {lede ? (
        <Link href={storyUrl(lede)} className="ep-media-lede">
          <StoryThumb story={lede} ratio="3 / 2" priority />
          <div className="ep-media-lede-copy ed-featured-meta">
            <PillarKicker story={lede} />
            <h2 className="ep-media-lede-title">{lede.title}</h2>
            {lede.excerpt ? <p className="ep-media-lede-dek">{lede.excerpt}</p> : null}
            <StoryByline story={lede} featured />
          </div>
        </Link>
      ) : (
        <div className="ep-media-empty">No published stories yet.</div>
      )}
      {secondary ? (
        <Link href={storyUrl(secondary)} className="ep-media-secondary">
          <StoryThumb story={secondary} ratio="3 / 2" />
          <div className="ep-media-secondary-copy">
            <PillarKicker story={secondary} />
            <h3 className="ep-media-secondary-title" style={titleClamp(3)}>
              {secondary.title}
            </h3>
            <StoryByline story={secondary} />
          </div>
        </Link>
      ) : null}
    </div>
  )
}

function FeaturedGrid({ stories }: { stories: MediaStory[] }) {
  if (stories.length === 0) return null
  return (
    <section className="ep-media-featured" data-media-module="featured-grid">
      <div className="ep-media-module-head">
        <h2>Featured</h2>
      </div>
      <div className="ep-media-featured-grid">
        {stories.map(story => (
          <Link key={story.id} href={storyUrl(story)} className="ep-media-feature-card">
            <StoryThumb story={story} ratio="16 / 9" />
            <div className="ep-media-feature-copy">
              <PillarKicker story={story} />
              <h3 style={titleClamp(2)}>{story.title}</h3>
              <StoryByline story={story} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function LatestRail({
  stories,
  midRectAt,
  midRectAds,
}: {
  stories: MediaStory[]
  midRectAt?: readonly number[]
  midRectAds?: ReadonlyArray<SponsorAd | null | undefined>
}) {
  if (stories.length === 0) return null
  return (
    <section className="ep-media-latest" data-media-module="latest-list">
      <div className="ep-media-module-head">
        <h2>Latest</h2>
        <Link href="/media">More from Evolved Pros Media</Link>
      </div>
      <ul className="ep-media-latest-list">
        {stories.map((story, index) => (
          <li key={story.id}>
            <Link href={storyUrl(story)} className="ep-media-list-row">
              <StoryThumb story={story} ratio="3 / 2" />
              <div>
                <PillarKicker story={story} />
                <h3 style={titleClamp(2)}>{story.title}</h3>
                <StoryByline story={story} />
              </div>
            </Link>
            {index === 1 ? (
              <MediaPartnerSlot kind="sponsored-row" locationId="media-sponsored-1" />
            ) : null}
            {midRectAt?.includes(index) ? (
              <MediaScrollRect
                ad={midRectAds?.[midRectAt.indexOf(index)] ?? null}
                locationId={`media-home-latest-rect-${index}`}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function OnAirRail() {
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

function MostRead({ stories }: { stories: MediaStory[] }) {
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
            <Link href={storyUrl(story)}>
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

function BriefCta() {
  return (
    <section className="ep-media-brief-cta" data-media-module="brief-cta">
      <p>One read every weekday from Evolved Pros Media.</p>
      <Link href="/podcast">Get the brief</Link>
    </section>
  )
}

function PodcastModule({ episodes }: { episodes: Episode[] }) {
  if (episodes.length === 0) return null
  return (
    <section className="ep-media-podcast" data-media-module="podcast" data-media-podcast-rail>
      <div className="ep-media-module-head">
        <h2>The Podcast</h2>
        <Link href="/podcast">All episodes</Link>
      </div>
      <div className="ep-media-podcast-grid">
        {episodes.slice(0, 5).map(ep => {
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
              <div className="ep-media-podcast-still">
                {still ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={still}
                    alt=""
                    width={320}
                    height={180}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: '50% 12%' }}
                  />
                ) : null}
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

export function MediaPortalClient({
  stories,
  episodes,
  sidebarAd = null,
  inFeedAds = [],
}: MediaPortalClientProps) {
  const desk = useMemo(() => splitHubDesk(stories), [stories])
  const leaderboardAd = inFeedAds[0] ?? null
  const midFluidAd = inFeedAds[1] ?? null
  const bands = homeMidRectBands({
    featuredCount: desk.featuredGrid.length,
    sectionCount: desk.sections.length,
    episodeCount: episodes.length,
  })
  const latestRectAt = latestMidRectIndexes(desk.latestList.length, { skipTrailing: true })
  let nextRect = 2
  const takeRect = () => inFeedAds[nextRect++] ?? null
  const featuredRectAd = bands.includes('after-featured') ? takeRect() : null
  const latestRectAds = latestRectAt.map(() => takeRect())
  const sectionsRectAd = bands.includes('after-sections') ? takeRect() : null
  const podcastRectAd = bands.includes('after-podcast') ? takeRect() : null

  return (
    <div className="ep-media-home">
      <div className="ep-media-home-inner">
        <div className="ep-media-leaderboard">
          <MediaPartnerSlot kind="leaderboard" ad={leaderboardAd} locationId="media-leaderboard" />
        </div>

        <div className="ep-media-home-grid">
          <div className="ep-media-home-main">
            <DualHero lede={desk.featured} secondary={desk.secondary} />
            <FeaturedGrid stories={desk.featuredGrid} />
            {bands.includes('after-featured') ? (
              <MediaScrollRect ad={featuredRectAd} locationId="media-home-rect-featured" />
            ) : null}
            <LatestRail
              stories={desk.latestList}
              midRectAt={latestRectAt}
              midRectAds={latestRectAds}
            />
            <div className="ep-media-mid-fluid">
              <MediaPartnerSlot kind="mid-fluid" ad={midFluidAd} locationId="media-mid-fluid" />
            </div>
            {desk.sections.map(section => (
              <section
                key={section.id}
                data-media-section={section.id}
                className="ep-media-more-section"
              >
                <div className="ep-media-module-head">
                  <h2>{section.label}</h2>
                  <Link href={section.href}>{moreInLabel(section.label)}</Link>
                </div>
                <ul className="ep-media-latest-list">
                  {section.stories.map(story => (
                    <li key={`${section.id}-${story.id}`}>
                      <Link href={storyUrl(story)} className="ep-media-list-row">
                        <StoryThumb story={story} ratio="3 / 2" />
                        <div>
                          <PillarKicker story={story} />
                          <h3 style={titleClamp(2)}>{story.title}</h3>
                          <StoryByline story={story} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
            {bands.includes('after-sections') ? (
              <MediaScrollRect ad={sectionsRectAd} locationId="media-home-rect-sections" />
            ) : null}
          </div>

          <aside className="ep-media-home-rail">
            <OnAirRail />
            <MostRead stories={stories} />
            <BriefCta />
            <div className="ep-media-rail-slot media-sticky-rail">
              <MediaPartnerSlot kind="rail-half" ad={sidebarAd} locationId="media-rail" />
            </div>
          </aside>
        </div>

        <PodcastModule episodes={episodes} />
        {bands.includes('after-podcast') ? (
          <MediaScrollRect ad={podcastRectAd} locationId="media-home-rect-podcast" />
        ) : null}
      </div>
    </div>
  )
}
