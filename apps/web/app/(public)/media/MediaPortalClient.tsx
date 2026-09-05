'use client'

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CategoryPills } from '@/components/media/CategoryPills'
import { MediaLatestPodcast } from '@/components/media/MediaLatestPodcast'
import { getPillarLabel } from '@/lib/pillars'
import { PollWidget } from '@/components/media/PollWidget'
import { MediaIabSlot } from '@/components/media/MediaIabSlot'
import { layoutMediaFeed } from '@/lib/media/feedAds'
import { mediaFilterCategories } from '@/lib/media/filters'
import {
  MEDIA_INDEX_SECTIONS,
  MEDIA_NAVY,
  MEDIA_ON_AIR,
  MEDIA_RED,
  MEDIA_TEAL,
  moreInLabel,
  popularStories,
  splitHubDesk,
} from '@/lib/media/desk'
import type { MediaRailEpisode } from '@/lib/media/podcastRail'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

// ── Types ──────────────────────────────────────────────────────────────────

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
  /** Single sticky rail unit (300×600 / half-page preferred). */
  sidebarAd?: SponsorAd | null
  /** In-feed units. One between story rows, never a footer pair. */
  inFeedAds?: SponsorAd[]
}

// ── Pillar / category helpers ───────────────────────────────────────────────

const ALL_LABEL = 'All'

/** Tag colour by pillar slug. Foundation/Identity/Mental Toughness/Strategy/
 *  Accountability/Execution use the brief's spec; everything else falls back to red. */
const PILLAR_TAG_COLORS: Record<string, string> = {
  foundation:         'var(--pillar-1)',
  identity:           'var(--pillar-2)',
  'mental-toughness': 'var(--pillar-3)',
  strategy:           'var(--pillar-4)',
  accountability:     'var(--pillar-5)',
  execution:          'var(--pillar-6)',
}
const FALLBACK_TAG_COLOR = 'var(--brand-red)'

function tagColorForStory(story: MediaStory): string {
  return PILLAR_TAG_COLORS[story.pillar ?? ''] ?? FALLBACK_TAG_COLOR
}

function tagLabelForStory(story: MediaStory): string {
  if (story.pillar && PILLAR_TAG_COLORS[story.pillar]) {
    return getPillarLabel(story.pillar)
  }
  return story.story_type ? story.story_type.toUpperCase() : 'EVOLVED'
}

function categoryToPillar(category: string): string | null {
  switch (category) {
    case 'Foundation':       return 'foundation'
    case 'Identity':         return 'identity'
    case 'Mental Toughness': return 'mental-toughness'
    case 'Strategy':         return 'strategy'
    case 'Accountability':   return 'accountability'
    case 'Execution':        return 'execution'
    default:                 return null
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// ── Pillar tag chip ────────────────────────────────────────────────────────

function PillarTag({
  story,
  variant = 'card',
}: {
  story: MediaStory
  variant?: 'card' | 'hero' | 'list'
}) {
  const color = tagColorForStory(story)
  const label = tagLabelForStory(story)
  const style: CSSProperties = variant === 'hero'
    ? {
        backgroundColor: color,
        color: '#fff',
        border: `1px solid ${color}`,
      }
    : {
        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
      }
  return (
    <span
      style={{
        ...style,
        display: 'inline-block',
        padding: variant === 'list' ? '2px 6px' : '3px 8px',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 700,
        fontSize: variant === 'list' ? 9 : 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        borderRadius: 2,
      }}
    >
      {label}
    </span>
  )
}

function StoryMeta({
  story,
  tone = 'ink',
}: {
  story: MediaStory
  tone?: 'ink' | 'paper'
}) {
  const color = tone === 'paper' ? 'rgba(255,255,255,0.7)' : 'var(--media-ink-soft)'
  return (
    <p
      suppressHydrationWarning
      style={{
        margin: 0,
        fontSize: 11,
        color,
        fontFamily: 'var(--font-body)',
      }}
    >
      {tagLabelForStory(story)}
      {story.published_at ? ` · ${formatDate(story.published_at)}` : ''}
      {` · ${readTime(story.body)} read`}
    </p>
  )
}

// ── Featured hero card ─────────────────────────────────────────────────────

function FeaturedCard({ story }: { story: MediaStory }) {
  return (
    <Link
      href={storyUrl(story)}
      style={{
        display: 'block',
        textDecoration: 'none',
        position: 'relative',
        aspectRatio: '16/9',
        borderRadius: 4,
        overflow: 'hidden',
        background: 'var(--brand-navy)',
      }}
    >
      {story.featured_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={story.featured_image_url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--media-ink), var(--media-ink-deep))' }} />
      )}

      <div style={{ position: 'absolute', top: 16, left: 16 }}>
        <PillarTag story={story} variant="hero" />
      </div>

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.0) 60%)',
        }}
      />

      <div
        className="ed-featured-meta"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '20px 24px 22px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 16,
          alignItems: 'end',
          maxWidth: '100%',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 500,
              fontSize: 24,
              lineHeight: 1.2,
              color: '#fff',
              margin: '0 0 8px',
              minWidth: 0,
              ...titleClamp(2),
            }}
          >
            {story.title}
          </h2>
          <StoryMeta story={story} tone="paper" />
        </div>
        <span
          suppressHydrationWarning
          className="ed-featured-meta-byline"
          style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.7)',
            fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
            textAlign: 'right',
          }}
        >
          {story.author ?? 'George Leith'}
        </span>
      </div>
    </Link>
  )
}

function LatestListModule({ stories }: { stories: MediaStory[] }) {
  if (stories.length === 0) return null
  return (
    <div
      data-media-module="latest-list"
      style={{
        marginTop: 16,
        background: 'var(--paper-card)',
        border: `1px solid ${MEDIA_NAVY}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '8px 12px',
          borderBottom: `2px solid ${MEDIA_RED}`,
        }}
      >
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 12,
            color: MEDIA_NAVY,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          Latest
        </span>
        <Link
          href="/media"
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 11,
            color: MEDIA_RED,
            textDecoration: 'none',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          More from Evolved Pros Media
        </Link>
      </div>
      {stories.map(story => (
        <Link
          key={story.id}
          href={storyUrl(story)}
          style={{
            display: 'block',
            padding: '10px 12px',
            borderBottom: '1px solid var(--paper-line-soft)',
            textDecoration: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <PillarTag story={story} variant="list" />
          </div>
          <h3
            style={{
              margin: '0 0 4px',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: 16,
              lineHeight: 1.25,
              color: MEDIA_NAVY,
              ...titleClamp(2),
            }}
          >
            {story.title}
          </h3>
          <p
            suppressHydrationWarning
            style={{ margin: 0, fontSize: 11, color: MEDIA_TEAL, fontFamily: 'var(--font-body)' }}
          >
            {story.author ?? 'George Leith'} · {formatDate(story.published_at)} · {readTime(story.body)} read
          </p>
        </Link>
      ))}
    </div>
  )
}

function ArticleCard({ story }: { story: MediaStory }) {
  return (
    <Link
      href={storyUrl(story)}
      className="media-card"
      style={{
        display: 'block',
        textDecoration: 'none',
        background: 'var(--paper-card)',
        border: '1px solid var(--paper-line-soft)',
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
    >
      <div style={{ aspectRatio: '4/3', background: 'var(--navy-dark)', overflow: 'hidden' }}>
        {story.featured_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={story.featured_image_url}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--media-ink), var(--media-ink-deep))' }} />
        )}
      </div>

      <div style={{ padding: '14px 14px 16px' }}>
        <PillarTag story={story} />
        <h3
          style={{
            margin: '10px 0 8px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 16,
            lineHeight: 1.3,
            color: 'var(--navy-dark)',
            ...titleClamp(2),
          }}
        >
          {story.title}
        </h3>
        <StoryMeta story={story} />
      </div>
    </Link>
  )
}

function SectionHead({
  label,
  href,
}: {
  label: string
  href: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <div style={{ width: 40, height: 2, background: MEDIA_NAVY }} />
      <span
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: 13,
          color: MEDIA_NAVY,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--paper-line-soft)' }} />
      <Link
        href={href}
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: 12,
          color: MEDIA_RED,
          textDecoration: 'none',
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}
      >
        {moreInLabel(label)} →
      </Link>
    </div>
  )
}

function RailCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div
      className="ed-rail-card"
      style={{
        marginBottom: 16,
        maxWidth: '100%',
        overflow: 'hidden',
        background: 'var(--paper-card)',
        border: '1px solid var(--paper-line-soft)',
      }}
    >
      <div style={{ background: 'var(--paper-card)', padding: '10px 12px', borderBottom: `2px solid ${MEDIA_RED}` }}>
        <span
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 700,
            fontSize: 12,
            color: MEDIA_NAVY,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
          }}
        >
          {title}
        </span>
      </div>
      <div className="ed-rail-card-body" style={{ background: 'var(--paper-card)' }}>
        {children}
      </div>
    </div>
  )
}

function DeskRail({
  stories,
  episodes,
  sidebarAd,
}: {
  stories: MediaStory[]
  episodes: Episode[]
  sidebarAd?: SponsorAd | null
}) {
  const popular = popularStories(stories, 5)
  return (
    <aside>
      <RailCard title="On Air">
        {MEDIA_ON_AIR.map(link => (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: 'block',
              padding: '10px 12px',
              borderBottom: '1px solid var(--paper-line-soft)',
              textDecoration: 'none',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: MEDIA_NAVY,
            }}
          >
            {link.label} →
          </Link>
        ))}
      </RailCard>

      <MediaLatestPodcast episodes={episodes} />

      {popular.length > 0 && (
        <RailCard title="Popular">
          {popular.map(s => (
            <Link
              key={s.id}
              href={storyUrl(s)}
              style={{
                display: 'block',
                padding: '10px 12px',
                borderBottom: '1px solid var(--paper-line-soft)',
                textDecoration: 'none',
              }}
            >
              <p
                style={{
                  fontSize: 9,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  fontFamily: '"Barlow Condensed", sans-serif',
                  color: tagColorForStory(s),
                  letterSpacing: '0.10em',
                  margin: '0 0 3px',
                }}
              >
                {tagLabelForStory(s)}
              </p>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: MEDIA_NAVY,
                  lineHeight: 1.3,
                  fontFamily: 'var(--font-body)',
                  margin: '0 0 3px',
                  ...titleClamp(2),
                }}
              >
                {s.title}
              </p>
              <p suppressHydrationWarning style={{ fontSize: 10, color: MEDIA_TEAL, fontFamily: 'var(--font-body)', margin: 0 }}>
                {formatDate(s.published_at)} · {readTime(s.body)} read
              </p>
            </Link>
          ))}
        </RailCard>
      )}

      <RailCard title="Sections">
        {MEDIA_INDEX_SECTIONS.filter(s => s.pillar).map(section => (
          <Link
            key={section.id}
            href={section.href}
            style={{
              display: 'block',
              padding: '9px 12px',
              borderBottom: '1px solid var(--paper-line-soft)',
              textDecoration: 'none',
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: MEDIA_NAVY,
            }}
          >
            {moreInLabel(section.label)} →
          </Link>
        ))}
      </RailCard>

      <PollWidget />

      {sidebarAd?.image_url ? (
        <div
          data-media-ads="sidebar"
          className="media-sticky-rail"
          style={{ marginTop: 16, position: 'sticky', top: 24 }}
        >
          <MediaIabSlot ad={sidebarAd} locationId="media-rail" />
        </div>
      ) : null}
    </aside>
  )
}

function MediaScrollBanner({ ad }: { ad: SponsorAd }) {
  return (
    <div
      data-media-ads="scroll-banner"
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        padding: '8px 0 4px',
      }}
    >
      <MediaIabSlot ad={ad} locationId="media-scroll" />
    </div>
  )
}

export function MediaPortalClient({
  stories,
  episodes,
  sidebarAd = null,
  inFeedAds = [],
}: MediaPortalClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>(ALL_LABEL)
  const pillarFilters = useMemo(() => mediaFilterCategories(stories), [stories])
  const heroAd = inFeedAds[0] ?? null

  const filteredStories = useMemo(() => {
    if (activeCategory === ALL_LABEL) return stories
    const slug = categoryToPillar(activeCategory)
    return slug ? stories.filter(s => s.pillar === slug) : stories
  }, [stories, activeCategory])

  const desk = useMemo(() => splitHubDesk(filteredStories), [filteredStories])
  const filteredRemainder = filteredStories.slice(1 + desk.latestList.length)
  const filteredFeed = useMemo(
    () => layoutMediaFeed(filteredRemainder, heroAd ? inFeedAds.slice(1) : inFeedAds),
    [filteredRemainder, heroAd, inFeedAds],
  )

  return (
    <>
      <CategoryPills
        initialActive={activeCategory}
        onSelect={setActiveCategory}
        categories={pillarFilters}
      />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px 0' }}>
        <div
          className="media-hero-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}
        >
          <div>
            {desk.featured ? (
              <FeaturedCard story={desk.featured} />
            ) : (
              <div
                style={{
                  aspectRatio: '16/9',
                  border: '1px dashed var(--paper-line-soft)',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--media-ink-soft)',
                  fontSize: 13,
                  fontFamily: 'var(--font-body)',
                  background: 'var(--paper-card)',
                }}
              >
                No published stories in this category yet.
              </div>
            )}
            <LatestListModule stories={desk.latestList} />
          </div>

          <DeskRail stories={stories} episodes={episodes} sidebarAd={sidebarAd} />
        </div>
      </div>

      {heroAd?.image_url ? (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px 0' }}>
          <MediaScrollBanner ad={heroAd} />
        </div>
      ) : null}

      {activeCategory === ALL_LABEL ? (
        desk.sections.map(section => (
          <div key={section.id} data-media-section={section.id} style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 0' }}>
            <SectionHead label={section.label} href={section.href} />
            <div className="media-card-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.stories.map(s => (
                <ArticleCard key={`${section.id}-${s.id}`} story={s} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 0' }}>
          <SectionHead label={activeCategory} href={`/media/${categoryToPillar(activeCategory) ?? ''}`} />
          {filteredFeed.chunks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {filteredFeed.chunks.map((chunk, idx) =>
                chunk.kind === 'ad' ? (
                  <MediaScrollBanner key={`${chunk.ad.id}-${idx}`} ad={chunk.ad} />
                ) : (
                  <div
                    key={chunk.items.map(s => s.id).join('-') || `row-${idx}`}
                    className="media-card-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {chunk.items.map(s => (
                      <ArticleCard key={s.id} story={s} />
                    ))}
                  </div>
                ),
              )}
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
              <span style={{ fontSize: 13, color: 'var(--media-ink-soft)', fontFamily: 'var(--font-body)' }}>
                {filteredStories.length === 0
                  ? 'No published stories in this category yet.'
                  : 'That is the only story in this category right now.'}
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{ height: 56 }} />

      <style>{`
        .media-card { transform: translateZ(0); }
        .media-card:hover {
          transform: scale(1.02);
          box-shadow: 0 14px 30px rgba(27,42,74,0.12);
        }
        @media (max-width: 767px) {
          .media-hero-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 639px) {
          .ed-featured-meta { padding: 14px 16px 16px !important; gap: 8px !important; grid-template-columns: 1fr !important; }
          .ed-featured-meta-byline { text-align: left !important; white-space: normal !important; }
          .ed-rail-card { width: 100%; max-width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .media-card:hover { transform: none; }
        }
      `}</style>
    </>
  )
}
