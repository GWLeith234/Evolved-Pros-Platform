'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CategoryPills, CATEGORY_COLORS } from '@/components/media/CategoryPills'
import { getPillarLabel } from '@/lib/pillars'
import { PollWidget } from '@/components/media/PollWidget'
import { MediaAdZone } from '@/components/media/MediaAdZone'

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

export interface Episode {
  id: string
  episode_number: number
  title: string
  slug: string
  thumbnail_url: string | null
  duration_seconds: number | null
  published_at: string | null
}

interface MediaPortalClientProps {
  stories: MediaStory[]
  episodes: Episode[]
  authorAvatars?: Record<string, string>
}

// ── Pillar / category helpers ───────────────────────────────────────────────

const ALL_LABEL = 'All'

/** Tag colour by pillar slug — Foundation/Identity/Mental Toughness/Strategy/
 *  Accountability/Execution use the brief's spec; everything else (null,
 *  story-type only, future "revenue"/"ai" sections) falls back to red. */
const PILLAR_TAG_COLORS: Record<string, string> = {
  foundation:         '#FFA538',
  identity:           '#A78BFA',
  'mental-toughness': '#F87171',
  strategy:           '#60A5FA',
  accountability:     '#C9A84C',
  execution:          '#0ABFA3',
}
const FALLBACK_TAG_COLOR = '#C9302A'

function tagColorForStory(story: MediaStory): string {
  return PILLAR_TAG_COLORS[story.pillar ?? ''] ?? FALLBACK_TAG_COLOR
}

function tagLabelForStory(story: MediaStory): string {
  if (story.pillar && PILLAR_TAG_COLORS[story.pillar]) {
    return getPillarLabel(story.pillar)
  }
  return story.story_type ? story.story_type.toUpperCase() : 'EVOLVED'
}

/** Map a CategoryPills label to the matching story.pillar slug. Editorial
 *  sections (Revenue/AI/Leadership) don't have a column today, so they
 *  filter to nothing until media_stories.section ships. */
function categoryToPillar(category: string): string | null {
  switch (category) {
    case 'Foundation':       return 'foundation'
    case 'Identity':         return 'identity'
    case 'Mental Toughness': return 'mental-toughness'
    case 'Strategy':         return 'strategy'
    case 'Accountability':   return 'accountability'
    case 'Execution':        return 'execution'
    default:                 return null   // Revenue / AI / Leadership / All
  }
}

function isEditorialCategory(category: string): boolean {
  return category === 'Revenue' || category === 'AI' || category === 'Leadership'
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

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function storyUrl(story: MediaStory): string {
  return `/media/${story.pillar ?? 'general'}/${story.slug}`
}

// ── Pillar tag chip (shared by hero + cards) ───────────────────────────────

function PillarTag({
  story,
  variant = 'card',
}: {
  story: MediaStory
  variant?: 'card' | 'hero'
}) {
  const color = tagColorForStory(story)
  const label = tagLabelForStory(story)
  // Hero variant sits on a dark gradient overlay → solid colour reads cleaner.
  // Card variant sits on white surface → 10%/30% chip per the brief.
  const style: React.CSSProperties = variant === 'hero'
    ? {
        backgroundColor: color,
        color: '#fff',
        border: `1px solid ${color}`,
      }
    : {
        backgroundColor: `${color}1A`,   // ~10%
        color,
        border: `1px solid ${color}4D`,  // ~30%
      }
  return (
    <span
      style={{
        ...style,
        display: 'inline-block',
        padding: '3px 8px',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        borderRadius: 2,
      }}
    >
      {label}
    </span>
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
        background: '#1B2A4A',
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
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2B3A5A, #1A2540)' }} />
      )}

      {/* Pillar tag — top-left */}
      <div style={{ position: 'absolute', top: 16, left: 16 }}>
        <PillarTag story={story} variant="hero" />
      </div>

      {/* Dark gradient overlay (bottom → top) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.0) 60%)',
        }}
      />

      {/* Title + meta */}
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
        <h2
          style={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 500,
            fontSize: 24,
            lineHeight: 1.2,
            color: '#fff',
            margin: 0,
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 3,
            overflow: 'hidden',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            minWidth: 0,
          }}
        >
          {story.title}
        </h2>
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
          {story.author ?? 'George Leith'} · {readTime(story.body)} read
        </span>
      </div>
    </Link>
  )
}

// ── Supporting card ─────────────────────────────────────────────────────────

function ArticleCard({ story }: { story: MediaStory }) {
  return (
    <Link
      href={storyUrl(story)}
      className="media-card"
      style={{
        display: 'block',
        textDecoration: 'none',
        background: '#FFFFFF',
        border: '1px solid #E5E0D8',
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
    >
      {/* Image — 4:3 */}
      <div style={{ aspectRatio: '4/3', background: '#112535', overflow: 'hidden' }}>
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
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2B3A5A, #1A2540)' }} />
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
            color: '#112535',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            overflow: 'hidden',
          }}
        >
          {story.title}
        </h3>
        <p
          suppressHydrationWarning
          style={{
            margin: 0,
            fontSize: 11,
            color: '#6B7280',
            fontFamily: 'var(--font-body)',
          }}
        >
          {story.author ?? 'George Leith'} · {formatDate(story.published_at)}
        </p>
      </div>
    </Link>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export function MediaPortalClient({
  stories,
  episodes,
  authorAvatars: _authorAvatars = {},
}: MediaPortalClientProps) {
  void _authorAvatars   // currently unused after the redesign — preserved on
                        // the prop so the server fetch doesn't have to change.
  const [activeCategory, setActiveCategory] = useState<string>(ALL_LABEL)

  const filteredStories = useMemo(() => {
    if (activeCategory === ALL_LABEL) return stories
    if (isEditorialCategory(activeCategory)) {
      // No backing column yet — return empty list for an honest empty state.
      return []
    }
    const slug = categoryToPillar(activeCategory)
    return slug ? stories.filter(s => s.pillar === slug) : stories
  }, [stories, activeCategory])

  const featured = filteredStories[0] ?? null
  const grid = filteredStories.slice(1)
  // Right rail "Latest Stories" stays unfiltered per the brief.
  const sidebarStories = stories.slice(0, 4)

  return (
    <>
      {/* Filter pills */}
      <CategoryPills
        initialActive={activeCategory}
        onSelect={setActiveCategory}
      />

      {/* ── Section 1: Hero + right rail ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px 0' }}>
        <div
          className="media-hero-grid"
          style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}
        >
          {/* LEFT — Featured card (or empty state) */}
          <div>
            {featured ? (
              <FeaturedCard story={featured} />
            ) : (
              <div
                style={{
                  aspectRatio: '16/9',
                  border: '1px dashed #E5E0D8',
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6B7280',
                  fontSize: 13,
                  fontFamily: 'var(--font-body)',
                  background: '#FFFFFF',
                }}
              >
                {isEditorialCategory(activeCategory)
                  ? `No ${activeCategory} stories yet — section ships in MR2.`
                  : 'No published stories in this category yet.'}
              </div>
            )}
          </div>

          {/* RIGHT — sidebar (intentionally NOT filtered per brief) */}
          <aside>
            {/* Latest Podcast */}
            {episodes.length > 0 && (
              <div className="ed-rail-card" style={{ marginBottom: 16, maxWidth: '100%', overflow: 'hidden', background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
                <div style={{ background: '#FFFFFF', padding: '10px 12px', borderBottom: '2px solid #C9A84C' }}>
                  <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 12, color: '#112535', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                    Latest Podcast
                  </span>
                </div>
                <div className="ed-rail-card-body" style={{ background: '#FFFFFF' }}>
                  {episodes.map(ep => (
                    <div key={ep.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid #E5E0D8' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 4, background: '#112535', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                        <span style={{ fontSize: 18 }}>🎙</span>
                        <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 7, fontWeight: 700, fontFamily: '"Barlow Condensed", sans-serif', backgroundColor: '#C9302A', color: '#FFFFFF', padding: '1px 4px', borderRadius: 2, textTransform: 'uppercase' }}>
                          EP
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 9, color: '#6B7280', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                          Episode {ep.episode_number}
                        </p>
                        <p style={{ fontSize: 12, color: '#112535', fontWeight: 600, fontFamily: 'var(--font-body)', lineHeight: 1.3, margin: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ep.title}
                        </p>
                        <p style={{ fontSize: 10, color: '#6B7280', fontFamily: 'var(--font-body)', margin: 0 }}>
                          {formatDuration(ep.duration_seconds)}
                        </p>
                      </div>
                      <Link href={`/podcast/${ep.slug ?? ''}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                        <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#C9302A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span aria-hidden="true" style={{ width: 0, height: 0, borderLeft: '8px solid #fff', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', marginLeft: 2 }} />
                        </span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Stories — always unfiltered so the rail stays useful */}
            {sidebarStories.length > 0 && (
              <div className="ed-rail-card" style={{ marginBottom: 16, maxWidth: '100%', overflow: 'hidden', background: '#FFFFFF', border: '1px solid #E5E0D8' }}>
                <div style={{ background: '#FFFFFF', padding: '10px 12px', borderBottom: '2px solid #C9A84C' }}>
                  <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 12, color: '#112535', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                    Latest Stories
                  </span>
                </div>
                <div className="ed-rail-card-body" style={{ background: '#FFFFFF' }}>
                  {sidebarStories.map(s => (
                    <Link key={s.id} href={storyUrl(s)} style={{ display: 'flex', alignItems: 'start', gap: 10, padding: '10px 12px', borderBottom: '1px solid #E5E0D8', textDecoration: 'none' }}>
                      <div style={{ position: 'relative', width: 64, height: 48, borderRadius: 2, background: '#112535', overflow: 'hidden', flexShrink: 0 }}>
                        {s.featured_image_url ? (
                          <Image src={s.featured_image_url} alt="" fill loading="lazy" sizes="64px" className="object-cover" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2B3A5A, #1A2540)' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, fontFamily: '"Barlow Condensed", sans-serif', color: tagColorForStory(s), letterSpacing: '0.10em', margin: '0 0 3px' }}>
                          {tagLabelForStory(s)}
                        </p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#112535', lineHeight: 1.3, fontFamily: 'var(--font-body)', margin: '0 0 3px' }}>
                          {s.title}
                        </p>
                        <p suppressHydrationWarning style={{ fontSize: 10, color: '#6B7280', fontFamily: 'var(--font-body)', margin: 0 }}>
                          {formatDate(s.published_at)} · {readTime(s.body)} read
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <PollWidget />

            {/* Wired to platform_ads (zone='B', placements contains 'media').
                MediaAdZone returns null when no active ad is assigned, so an
                unfilled slot collapses cleanly instead of leaking a debug
                placeholder into production. */}
            <div style={{ marginTop: 16 }}>
              <MediaAdZone zone="B" />
            </div>
          </aside>
        </div>
      </div>

      {/* ── Section 2: "More from Evolved Media" divider ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 2, background: '#C9A84C' }} />
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 12, color: '#112535', textTransform: 'uppercase', letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>
            {activeCategory === ALL_LABEL ? 'More from Evolved Media' : `More in ${activeCategory}`}
          </span>
          <div style={{ flex: 1, height: 1, background: '#E5E0D8' }} />
        </div>
      </div>

      {/* ── Section 3: Card grid ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px 56px' }}>
        {grid.length > 0 ? (
          <div className="media-card-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {grid.map(s => (
              <ArticleCard key={s.id} story={s} />
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: '#6B7280', fontFamily: 'var(--font-body)' }}>
              {filteredStories.length === 0
                ? 'No published stories in this category yet.'
                : 'That’s the only story in this category right now.'}
            </span>
          </div>
        )}
      </div>

      {/* Responsive + hover styles. Grid columns are owned by the Tailwind
          classes on the container (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3)
          so the hero-only collapse rule is the last bit of bespoke CSS. */}
      <style>{`
        .media-card { transform: translateZ(0); }
        .media-card:hover {
          transform: scale(1.02);
          box-shadow: 0 14px 30px rgba(27,42,74,0.12);
        }
        @media (max-width: 767px) {
          .media-hero-grid { grid-template-columns: 1fr !important; }
        }
        /* Mobile: featured-card byline shrinks (not overflows). Rail cards
           keep the hardcoded light surface — DO NOT flip to dark here. */
        @media (max-width: 639px) {
          .ed-featured-meta { padding: 14px 16px 16px !important; gap: 8px !important; grid-template-columns: 1fr !important; }
          .ed-featured-meta-byline { text-align: left !important; white-space: normal !important; }
          .ed-rail-card { width: 100%; max-width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .media-card:hover { transform: none; }
        }
      `}</style>

      {/* Reference CATEGORY_COLORS so the import isn't shaken out by tree-
          shakers — it backs CategoryPills' visual mapping which the brief
          asks us to keep aligned with this client. */}
      {CATEGORY_COLORS && null}
    </>
  )
}
