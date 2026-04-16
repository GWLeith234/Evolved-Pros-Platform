'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getPillarLabel, getPillarColor } from '@/lib/pillars'

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

// ── Constants ──────────────────────────────────────────────────────────────

const PILLAR_TEXT_COLORS: Record<string, string> = {
  foundation: '#CC7700',
  identity: '#534AB7',
  'mental-toughness': '#993556',
  strategy: '#185FA5',
  accountability: '#AA8C3C',
  execution: '#0F6E56',
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

function pillarTextColor(p: string | null): string {
  return PILLAR_TEXT_COLORS[p ?? ''] ?? getPillarColor(p)
}

function storyUrl(story: MediaStory): string {
  return `/media/${story.pillar ?? 'general'}/${story.slug}`
}

function fullUrl(story: MediaStory): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin + storyUrl(story)
}

// ── Share helpers ────────────────────────────────────────────────────────────

function shareLinkedIn(url: string) {
  window.open(`https://linkedin.com/shareArticle?url=${encodeURIComponent(url)}`, '_blank', 'noopener')
}

function shareX(url: string, title: string) {
  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank', 'noopener')
}

function shareEmail(url: string, title: string) {
  window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
}

// ── Share button components ────────────────────────────────────────────────

function LinkedInBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title="Share on LinkedIn" style={{ width: 24, height: 24, borderRadius: 2, backgroundColor: '#0077B5', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-condensed)' }}>
      in
    </button>
  )
}

function XBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title="Share on X" style={{ width: 24, height: 24, borderRadius: 2, backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-condensed)' }}>
      X
    </button>
  )
}

function EmailBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title="Share via Email" style={{ width: 24, height: 24, borderRadius: 2, backgroundColor: '#2B3A5A', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
      ✉
    </button>
  )
}

function CopyBtn({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      title="Copy link"
      onClick={() => {
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      style={{ width: copied ? 'auto' : 24, height: 24, borderRadius: 2, backgroundColor: 'transparent', color: '#2B3A5A', border: '1px solid #2B3A5A', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'var(--font-condensed)', padding: copied ? '0 8px' : 0 }}
    >
      {copied ? 'Copied!' : '🔗'}
    </button>
  )
}

// ── Article Card ────────────────────────────────────────────────────────────

function ArticleCard({ story }: { story: MediaStory }) {
  const url = fullUrl(story)
  return (
    <div style={{ backgroundColor: '#fff', border: '0.5px solid rgba(43,58,90,0.1)', borderRadius: 2, overflow: 'hidden' }}>
      {/* Image */}
      <Link href={storyUrl(story)} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{ aspectRatio: '16/9', backgroundColor: '#2B3A5A', overflow: 'hidden', position: 'relative' }}>
          {story.featured_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={story.featured_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2B3A5A, #1a2540)' }} />
          )}
        </div>
      </Link>
      <div style={{ padding: '10px 12px 12px' }}>
        {/* Pillar tag */}
        {story.pillar && (
          <p style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-condensed)', color: pillarTextColor(story.pillar), letterSpacing: '0.06em', marginBottom: 4 }}>
            {getPillarLabel(story.pillar)}
          </p>
        )}
        {/* Title */}
        <Link href={storyUrl(story)} style={{ textDecoration: 'none' }}>
          <h3 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 15, color: '#2B3A5A', lineHeight: 1.3, margin: '0 0 4px' }}>
            {story.title}
          </h3>
        </Link>
        {/* Excerpt */}
        {story.excerpt && (
          <p style={{ fontSize: 11, color: 'rgba(43,58,90,0.55)', lineHeight: 1.5, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {story.excerpt}
          </p>
        )}
        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span suppressHydrationWarning style={{ fontSize: 10, color: 'rgba(43,58,90,0.4)', fontFamily: 'var(--font-body)' }}>
            {formatDate(story.published_at)} · {readTime(story.body)} read
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <LinkedInBtn onClick={() => shareLinkedIn(url)} />
            <XBtn onClick={() => shareX(url, story.title)} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export function MediaPortalClient({
  featured,
  sidebar,
  grid,
  episodes,
  authorAvatars = {},
}: {
  featured: MediaStory | null
  sidebar: MediaStory[]
  grid: MediaStory[]
  episodes: Episode[]
  authorAvatars?: Record<string, string>
}) {
  return (
    <>
      {/* ── Section 1: Hero + Sidebar ── */}
      {featured && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 0' }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}
            className="media-hero-grid"
          >
            {/* LEFT — Hero article */}
            <div>
              {/* Hero image */}
              <Link href={storyUrl(featured)} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 2, overflow: 'hidden', backgroundColor: '#2B3A5A' }}>
                  {featured.featured_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={featured.featured_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2B3A5A, #1a2540)' }} />
                  )}
                  {/* Overlay */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 16px 14px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                    {featured.pillar && (
                      <span style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-condensed)', color: '#C9A84C', letterSpacing: '0.08em' }}>
                        {getPillarLabel(featured.pillar)}
                      </span>
                    )}
                    <h2 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, fontSize: 24, color: '#fff', lineHeight: 1.2, margin: '4px 0 6px' }}>
                      {featured.title}
                    </h2>
                    <span suppressHydrationWarning style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                      {featured.author ?? 'George Leith'} · {formatDate(featured.published_at)} · {readTime(featured.body)} read
                    </span>
                  </div>
                </div>
              </Link>

              {/* Excerpt */}
              {featured.excerpt && (
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 13, lineHeight: 1.75, color: '#3a4a56', margin: '12px 0 10px' }}>
                  {featured.excerpt}
                </p>
              )}

              {/* Byline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                {authorAvatars[featured.author ?? ''] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={authorAvatars[featured.author ?? '']} alt={featured.author ?? 'George Leith'} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#2B3A5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700, fontFamily: 'var(--font-condensed)', flexShrink: 0 }}>
                    {(featured.author ?? 'GL').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: 12, color: '#2B3A5A', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                  {featured.author ?? 'George Leith'} · Evolved Pros
                </span>
              </div>

              {/* Share strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 16, borderBottom: '1px solid rgba(43,58,90,0.1)' }}>
                <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-condensed)', color: 'rgba(43,58,90,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>Share</span>
                <LinkedInBtn onClick={() => shareLinkedIn(fullUrl(featured))} />
                <XBtn onClick={() => shareX(fullUrl(featured), featured.title)} />
                <EmailBtn onClick={() => shareEmail(fullUrl(featured), featured.title)} />
                <CopyBtn url={fullUrl(featured)} />
              </div>
            </div>

            {/* RIGHT — Sidebar */}
            <div>
              {/* Latest Podcast */}
              {episodes.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ backgroundColor: '#2B3A5A', padding: '7px 10px', marginBottom: 0 }}>
                    <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Latest Podcast
                    </span>
                  </div>
                  <div style={{ backgroundColor: '#fff', border: '0.5px solid rgba(43,58,90,0.1)', borderTop: 'none' }}>
                    {episodes.map(ep => (
                      <div key={ep.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '0.5px solid rgba(43,58,90,0.06)' }}>
                        {/* Podcast thumb */}
                        <div style={{ width: 44, height: 44, borderRadius: 4, backgroundColor: '#2B3A5A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                          <span style={{ fontSize: 18 }}>🎙</span>
                          <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 7, fontWeight: 700, fontFamily: 'var(--font-condensed)', backgroundColor: '#C9302A', color: '#fff', padding: '1px 4px', borderRadius: 2, textTransform: 'uppercase' }}>
                            EP
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 9, color: 'rgba(43,58,90,0.45)', fontFamily: 'var(--font-condensed)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                            Episode {ep.episode_number}
                          </p>
                          <p style={{ fontSize: 11, color: '#2B3A5A', fontWeight: 600, fontFamily: 'var(--font-body)', lineHeight: 1.3, margin: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ep.title}
                          </p>
                          <p style={{ fontSize: 9, color: 'rgba(43,58,90,0.4)', fontFamily: 'var(--font-body)', margin: 0 }}>
                            {formatDuration(ep.duration_seconds)}
                          </p>
                        </div>
                        {/* Play button */}
                        <Link href={`/podcast/${ep.slug ?? ''}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#C9302A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 0, height: 0, borderLeft: '8px solid #fff', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', marginLeft: 2 }} />
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest Stories */}
              {sidebar.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ backgroundColor: '#2B3A5A', padding: '7px 10px', marginBottom: 0 }}>
                    <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Latest Stories
                    </span>
                  </div>
                  <div style={{ backgroundColor: '#fff', border: '0.5px solid rgba(43,58,90,0.1)', borderTop: 'none' }}>
                    {sidebar.map(s => (
                      <Link key={s.id} href={storyUrl(s)} style={{ display: 'flex', alignItems: 'start', gap: 8, padding: '8px 10px', borderBottom: '0.5px solid rgba(43,58,90,0.06)', textDecoration: 'none' }}>
                        {/* Thumbnail */}
                        <div style={{ width: 58, height: 42, borderRadius: 2, backgroundColor: '#2B3A5A', overflow: 'hidden', flexShrink: 0 }}>
                          {s.featured_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.featured_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2B3A5A, #1a2540)' }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {s.pillar && (
                            <p style={{ fontSize: 8, textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-condensed)', color: pillarTextColor(s.pillar), letterSpacing: '0.06em', margin: '0 0 2px' }}>
                              {getPillarLabel(s.pillar)}
                            </p>
                          )}
                          <p style={{ fontSize: 11, fontWeight: 600, color: '#2B3A5A', lineHeight: 1.3, fontFamily: 'var(--font-body)', margin: '0 0 2px' }}>
                            {s.title}
                          </p>
                          <p suppressHydrationWarning style={{ fontSize: 9, color: 'rgba(43,58,90,0.4)', fontFamily: 'var(--font-body)', margin: 0 }}>
                            {formatDate(s.published_at)} · {readTime(s.body)} read
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Ad zone B placeholder */}
              <div style={{ border: '1px dashed rgba(43,58,90,0.2)', borderRadius: 2, padding: '20px 10px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontSize: 10, color: 'rgba(43,58,90,0.3)', fontFamily: 'var(--font-condensed)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Ad Zone B · 280×200
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 2: "MORE FROM EVOLVED MEDIA" divider ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 2, backgroundColor: '#2B3A5A', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 13, color: '#2B3A5A', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            More from Evolved Media
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(43,58,90,0.15)' }} />
        </div>
      </div>

      {/* ── Section 3: Article grid ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px 40px' }}>
        {grid.length > 0 ? (
          <>
            {/* First row */}
            <div className="media-article-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
              {grid.slice(0, 3).map(s => (
                <ArticleCard key={s.id} story={s} />
              ))}
            </div>

            {/* Ad Zone A */}
            <div style={{ border: '1px dashed rgba(43,58,90,0.2)', borderRadius: 2, padding: '16px', textAlign: 'center', marginBottom: 14, backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <span style={{ fontSize: 10, color: 'rgba(43,58,90,0.3)', fontFamily: 'var(--font-condensed)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Ad Zone A · Full Width
              </span>
            </div>

            {/* Second row */}
            {grid.length > 3 && (
              <div className="media-article-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {grid.slice(3, 6).map(s => (
                  <ArticleCard key={s.id} story={s} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: 'rgba(43,58,90,0.35)', fontFamily: 'var(--font-body)' }}>
              No published stories in this category yet.
            </span>
          </div>
        )}
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 767px) {
          .media-hero-grid {
            grid-template-columns: 1fr !important;
          }
          .media-article-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}
