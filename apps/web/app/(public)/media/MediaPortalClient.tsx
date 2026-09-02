'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CategoryPills, CATEGORY_COLORS } from '@/components/media/CategoryPills'
import { getPillarLabel } from '@/lib/pillars'
import { PollWidget } from '@/components/media/PollWidget'
import { MediaAdZoneClient as MediaAdZone } from './MediaClientShims'
import { MediaIabSlot } from '@/components/media/MediaIabSlot'
import { layoutMediaFeed } from '@/lib/media/feedAds'
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
  /** Zone C 728×90 — interleaved through the story scroll. */
  scrollBanners?: SponsorAd[]
  /** Zone A 300×250 — centered footer mix, never a 2×2 wall. */
  footerAds?: SponsorAd[]
}

// ── Pillar / category helpers ───────────────────────────────────────────────

const ALL_LABEL = 'All'

/** Tag colour by pillar slug — Foundation/Identity/Mental Toughness/Strategy/
 *  Accountability/Execution use the brief's spec; everything else (null,
 *  story-type only, future "revenue"/"ai" sections) falls back to red. */
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
        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
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
        background: 'var(--paper-card)',
        border: '1px solid var(--paper-line-soft)',
        borderRadius: 4,
        overflow: 'hidden',
        transition: 'transform 160ms ease, box-shadow 160ms ease',
      }}
    >
      {/* Image — 4:3 */}
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
            color: 'var(--media-ink-soft)',
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

function MediaSponsoredRule() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, width: '100%' }}>
      <span
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 700,
          fontSize: 9,
          letterSpacing: '0.42em',
          textTransform: 'uppercase',
          color: 'rgba(10,15,24,0.35)',
        }}
      >
        Sponsored
      </span>
      <span style={{ flex: 1, height: 1, background: 'var(--paper-line-soft)' }} />
    </div>
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
  scrollBanners = [],
  footerAds = [],
}: MediaPortalClientProps) {
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
  const feed = useMemo(
    () => layoutMediaFeed(grid, { banners: scrollBanners, footer: footerAds }),
    [grid, scrollBanners, footerAds],
  )
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
                {isEditorialCategory(activeCategory)
                  ? `${activeCategory} stories coming soon.`
                  : 'No published stories in this category yet.'}
              </div>
            )}
          </div>

          {/* RIGHT — sidebar (intentionally NOT filtered per brief) */}
          <aside>
            {/* Latest Podcast */}
            {episodes.length > 0 && (
              <div className="ed-rail-card" style={{ marginBottom: 16, maxWidth: '100%', overflow: 'hidden', background: 'var(--paper-card)', border: '1px solid var(--paper-line-soft)' }}>
                <div style={{ background: 'var(--paper-card)', padding: '10px 12px', borderBottom: '2px solid var(--brand-gold)' }}>
                  <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy-dark)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                    Latest Podcast
                  </span>
                </div>
                <div className="ed-rail-card-body" style={{ background: 'var(--paper-card)' }}>
                  {episodes.map(ep => (
                    <div key={ep.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid var(--paper-line-soft)' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 4, background: 'var(--navy-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                        <span style={{ fontSize: 18 }}>🎙</span>
                        <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 7, fontWeight: 700, fontFamily: '"Barlow Condensed", sans-serif', backgroundColor: 'var(--brand-red)', color: 'var(--white)', padding: '1px 4px', borderRadius: 2, textTransform: 'uppercase' }}>
                          EP
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 9, color: 'var(--media-ink-soft)', fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                          Episode {ep.episode_number}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--navy-dark)', fontWeight: 600, fontFamily: 'var(--font-body)', lineHeight: 1.3, margin: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ep.title}
                        </p>
                        <p style={{ fontSize: 10, color: 'var(--media-ink-soft)', fontFamily: 'var(--font-body)', margin: 0 }}>
                          {formatDuration(ep.duration_seconds)}
                        </p>
                      </div>
                      <Link href={`/podcast/${ep.slug ?? ''}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                        <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand-red)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
              <div className="ed-rail-card" style={{ marginBottom: 16, maxWidth: '100%', overflow: 'hidden', background: 'var(--paper-card)', border: '1px solid var(--paper-line-soft)' }}>
                <div style={{ background: 'var(--paper-card)', padding: '10px 12px', borderBottom: '2px solid var(--brand-gold)' }}>
                  <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy-dark)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
                    Latest Stories
                  </span>
                </div>
                <div className="ed-rail-card-body" style={{ background: 'var(--paper-card)' }}>
                  {sidebarStories.map(s => (
                    <Link key={s.id} href={storyUrl(s)} style={{ display: 'flex', alignItems: 'start', gap: 10, padding: '10px 12px', borderBottom: '1px solid var(--paper-line-soft)', textDecoration: 'none' }}>
                      <div style={{ position: 'relative', width: 64, height: 48, borderRadius: 2, background: 'var(--navy-dark)', overflow: 'hidden', flexShrink: 0 }}>
                        {s.featured_image_url ? (
                          <Image src={s.featured_image_url} alt="" fill loading="lazy" sizes="64px" className="object-cover" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--media-ink), var(--media-ink-deep))' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, fontFamily: '"Barlow Condensed", sans-serif', color: tagColorForStory(s), letterSpacing: '0.10em', margin: '0 0 3px' }}>
                          {tagLabelForStory(s)}
                        </p>
                        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy-dark)', lineHeight: 1.3, fontFamily: 'var(--font-body)', margin: '0 0 3px' }}>
                          {s.title}
                        </p>
                        <p suppressHydrationWarning style={{ fontSize: 10, color: 'var(--media-ink-soft)', fontFamily: 'var(--font-body)', margin: 0 }}>
                          {formatDate(s.published_at)} · {readTime(s.body)} read
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <PollWidget />

            {/* IAB zones A/B/E — platform-only and media placements both serve.
                Empty zones collapse instead of leaking a placeholder. */}
            <div style={{ marginTop: 16 }}>
              <MediaAdZone zone="A" />
              <MediaAdZone zone="B" />
              <MediaAdZone zone="E" />
            </div>
          </aside>
        </div>
      </div>

      {feed.leadBanner ? (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 0' }}>
          <MediaScrollBanner ad={feed.leadBanner} />
        </div>
      ) : null}

      {/* ── Section 2: "More from Evolved Media" divider ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 2, background: 'var(--brand-gold)' }} />
          <span style={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--navy-dark)', textTransform: 'uppercase', letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>
            {activeCategory === ALL_LABEL ? 'More from Evolved Media' : `More in ${activeCategory}`}
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--paper-line-soft)' }} />
        </div>
      </div>

      {/* ── Section 3: Card grid, Zone C banners between rows, footer squares ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px 56px' }}>
        {feed.chunks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {feed.chunks.map((chunk, idx) =>
              chunk.kind === 'banner' ? (
                <MediaScrollBanner key={chunk.ad.id} ad={chunk.ad} />
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
        ) : filteredStories.length === 0 && isEditorialCategory(activeCategory) ? null : (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--media-ink-soft)', fontFamily: 'var(--font-body)' }}>
              {filteredStories.length === 0
                ? 'No published stories in this category yet.'
                : 'That’s the only story in this category right now.'}
            </span>
          </div>
        )}

        {feed.footer.length > 0 ? (
          <section
            aria-label="Sponsored"
            data-media-ads="footer"
            style={{ marginTop: 40 }}
          >
            <MediaSponsoredRule />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 24,
              }}
            >
              {feed.footer.map(ad => (
                <MediaIabSlot
                  key={ad.id}
                  ad={ad}
                  locationId="media-footer"
                  style={{ marginInline: 0 }}
                />
              ))}
            </div>
          </section>
        ) : null}
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
