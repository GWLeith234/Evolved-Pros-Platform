import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { marked } from 'marked'
import { adminClient } from '@/lib/supabase/admin'
import { getPillarLabel, getPillarColor } from '@/lib/pillars'
import { StoryComments } from '@/components/media/StoryComments'
import { ArticleShareBar } from './ArticleShareBar'

export const revalidate = 3600
export const dynamicParams = true

// ── Types ──────────────────────────────────────────────────────────────────

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

interface RelatedStory {
  id: string
  title: string
  slug: string
  pillar: string | null
  featured_image_url: string | null
  published_at: string | null
  body: string | null
}

interface Episode {
  id: string
  episode_number: number
  title: string
  slug: string
  thumbnail_url: string | null
  duration_seconds: number | null
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function fetchStory(pillar: string, slug: string): Promise<Story | null> {
  const { data } = await adminClient
    .from('media_stories')
    .select('*')
    .eq('pillar', pillar)
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  return (data as Story | null)
}

function readTime(body: string | null): number {
  if (!body) return 1
  return Math.max(1, Math.ceil(body.split(/\s+/).length / 200))
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Static params ───────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const { data } = await adminClient
    .from('media_stories')
    .select('pillar, slug')
    .eq('is_published', true)
  return (data ?? [])
    .filter(s => s.pillar && s.slug)
    .map(s => ({ pillar: String(s.pillar), slug: String(s.slug) }))
}

// ── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { pillar: string; slug: string } }
): Promise<Metadata> {
  const story = await fetchStory(params.pillar, params.slug)
  if (!story) return {}

  const title = story.seo_title || `${story.title} | Evolved Media`
  const description = story.seo_description || story.excerpt || ''
  const image = story.featured_image_url || '/og-default.png'
  const url = `https://platform.evolvedpros.com/media/${params.pillar}/${params.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type: 'article',
      publishedTime: story.published_at ?? undefined,
      modifiedTime: story.updated_at ?? undefined,
      authors: [story.author ?? 'George Leith'],
      tags: story.tags ?? [],
      images: [{ url: image, width: 1200, height: 630, alt: story.title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

// ── Page ────────────────────────────────────────────────────────────────────

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

  const minutes = readTime(story.body)
  const html = story.body ? await marked.parse(story.body) : ''
  const pLabel = getPillarLabel(story.pillar)
  const pColor = getPillarColor(story.pillar)
  const articleUrl = `https://platform.evolvedpros.com/media/${params.pillar}/${params.slug}`

  // Look up author avatar by full_name (media_stories.author is a plain
  // string not an FK — match on users.full_name).
  let authorUser: { full_name: string | null; avatar_url: string | null; role: string | null; current_pillar: string | null } | null = null
  if (story.author) {
    // Defensive: order by created_at to make the result deterministic
    // if duplicate full_name rows ever exist again. .limit(1) ensures
    // PostgREST returns at most 1 row so .maybeSingle() can't 406.
    const { data: profile } = await adminClient
      .from('users')
      .select('full_name, avatar_url, role, current_pillar')
      .eq('full_name', story.author)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    authorUser = profile ?? null
    if (!authorUser) {
      console.warn('[author-photo] no user match for', story.author)
    }
  }
  const authorAvatar = authorUser?.avatar_url ?? null

  // Related stories: same pillar, exclude current
  const { data: related } = await adminClient
    .from('media_stories')
    .select('id, title, slug, pillar, featured_image_url, published_at, body')
    .eq('pillar', params.pillar)
    .eq('is_published', true)
    .neq('id', story.id)
    .order('published_at', { ascending: false })
    .limit(3)

  // Latest 2 episodes for sidebar
  let episodes: Episode[] = []
  try {
    const { data } = await adminClient
      .from('episodes')
      .select('id, episode_number, title, slug, thumbnail_url, duration_seconds')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(2)
    episodes = (data ?? []) as Episode[]
  } catch {
    // episodes table may not exist yet
  }

  // JSON-LD
  const articleSchema = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: story.title, description: story.excerpt,
    author: { '@type': 'Person', name: story.author ?? 'George Leith' },
    publisher: { '@type': 'Organization', name: 'Evolved Pros', url: 'https://platform.evolvedpros.com' },
    datePublished: story.published_at, dateModified: story.updated_at,
    url: articleUrl, image: story.featured_image_url || '/og-default.png',
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://platform.evolvedpros.com' },
      { '@type': 'ListItem', position: 2, name: 'Evolved Media', item: 'https://platform.evolvedpros.com/media' },
      { '@type': 'ListItem', position: 3, name: pLabel, item: `https://platform.evolvedpros.com/media/${params.pillar}` },
      { '@type': 'ListItem', position: 4, name: story.title.slice(0, 50) },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* 1. Breadcrumb */}
      <nav style={{ padding: '8px 24px', fontFamily: 'var(--font-condensed)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(43,58,90,0.45)' }}>
        <Link href="/media" style={{ color: 'rgba(43,58,90,0.45)', textDecoration: 'none' }}>Evolved Media</Link>
        <span style={{ margin: '0 6px', color: '#2B3A5A' }}>/</span>
        <Link href={`/media?pillar=${params.pillar}`} style={{ color: pColor, textDecoration: 'none' }}>{pLabel}</Link>
        <span style={{ margin: '0 6px', color: '#2B3A5A' }}>/</span>
        <span style={{ color: 'rgba(43,58,90,0.6)' }}>{story.title.length > 40 ? story.title.slice(0, 40) + '...' : story.title}</span>
      </nav>

      {/* 2. Wide Hero */}
      <div
        style={{
          position: 'relative',
          minHeight: 280,
          aspectRatio: '21/9',
          maxHeight: 380,
          backgroundImage: story.featured_image_url
            ? `url(${story.featured_image_url})`
            : 'linear-gradient(135deg, #1e3060, #2B3A5A)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.75))' }} />
        {/* Contents */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 }}>
          {story.pillar && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#C9A84C', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {pLabel}
              </span>
            </div>
          )}
          <h1 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, fontSize: 32, color: '#fff', lineHeight: 1.1, maxWidth: 680, margin: '0 0 8px' }}>
            {story.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authorAvatar} alt={story.author ?? 'George Leith'} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#2B3A5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700, fontFamily: 'var(--font-condensed)', flexShrink: 0 }}>
                {(story.author ?? 'GL').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-body)' }}>
              {story.author ?? 'George Leith'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-body)' }}>
              {formatDate(story.published_at)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>·</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-body)' }}>
              {minutes} min read
            </span>
          </div>
        </div>
      </div>

      {/* 3. Two-column layout */}
      <div
        className="media-detail-grid"
        style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24, maxWidth: 1100, margin: '0 auto', padding: '24px 24px 40px' }}
      >
        {/* LEFT — Article body */}
        <div>
          {/* Share bar (top) */}
          <ArticleShareBar articleUrl={articleUrl} articleTitle={story.title} label="Share this article" />

          {/* Pioneer spin source attribution */}
          {story.story_type === 'pioneer_spin' && story.source_name && (
            <div style={{ backgroundColor: 'rgba(43,58,90,0.04)', border: '1px solid rgba(43,58,90,0.08)', borderRadius: 2, padding: '10px 14px', margin: '16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 9, color: 'rgba(43,58,90,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pioneer Driver</span>
              <span style={{ fontSize: 12, color: 'rgba(43,58,90,0.5)', fontFamily: 'var(--font-body)' }}>
                Inspired by{' '}
                {story.source_url ? (
                  <a href={story.source_url} target="_blank" rel="noopener noreferrer" style={{ color: pColor, textDecoration: 'underline' }}>{story.source_name}</a>
                ) : story.source_name}
              </span>
            </div>
          )}

          {/* Article body */}
          <div
            className="media-prose"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Comments */}
          <StoryComments storyId={story.id} pillarColor={pColor} />

          {/* Share bar (bottom) */}
          <div style={{ marginTop: 24 }}>
            <ArticleShareBar articleUrl={articleUrl} articleTitle={story.title} label="Found this valuable?" />
          </div>
        </div>

        {/* RIGHT — Sidebar */}
        <div>
          {/* Author card */}
          <div style={{ backgroundColor: '#fff', border: '1px solid rgba(43,58,90,0.1)', borderRadius: 2, padding: 14, textAlign: 'center', marginBottom: 16 }}>
            {authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={authorAvatar} alt={story.author ?? 'George Leith'} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px', display: 'block', border: '2px solid #E0D8CC', backgroundColor: '#F5F0E8' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: '#2B3A5A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 24, color: '#fff', fontWeight: 700, fontFamily: 'var(--font-condensed)' }}>
                {(story.author ?? 'GL').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 16, color: '#2B3A5A', margin: '0 0 2px' }}>
              {story.author ?? 'George Leith'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(43,58,90,0.5)', fontFamily: 'var(--font-body)', margin: '0 0 8px' }}>
              Founder, Evolved Pros
            </p>
            <p style={{ fontSize: 11, color: 'rgba(43,58,90,0.6)', fontFamily: 'var(--font-body)', lineHeight: 1.6, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              Helping sales professionals and entrepreneurs master the 6 pillars of peak performance through the EVOLVED framework.
            </p>
            <Link
              href="/pricing"
              style={{ display: 'block', width: '100%', textAlign: 'center', padding: '8px 0', backgroundColor: '#C9302A', color: '#fff', fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', borderRadius: 2, textDecoration: 'none' }}
            >
              Join Evolved Pros →
            </Link>
          </div>

          {/* Latest Podcast */}
          {episodes.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ backgroundColor: '#2B3A5A', padding: '7px 10px' }}>
                <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Latest Podcast
                </span>
              </div>
              <div style={{ backgroundColor: '#fff', border: '0.5px solid rgba(43,58,90,0.1)', borderTop: 'none' }}>
                {episodes.map(ep => (
                  <div key={ep.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: '0.5px solid rgba(43,58,90,0.06)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 4, backgroundColor: '#2B3A5A', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
                      <span style={{ fontSize: 18 }}>🎙</span>
                      <span style={{ position: 'absolute', bottom: -2, right: -2, fontSize: 7, fontWeight: 700, fontFamily: 'var(--font-condensed)', backgroundColor: '#C9302A', color: '#fff', padding: '1px 4px', borderRadius: 2, textTransform: 'uppercase' }}>EP</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 9, color: 'rgba(43,58,90,0.45)', fontFamily: 'var(--font-condensed)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                        Episode {ep.episode_number}
                      </p>
                      <p style={{ fontSize: 11, color: '#2B3A5A', fontWeight: 600, fontFamily: 'var(--font-body)', lineHeight: 1.3, margin: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ep.title}
                      </p>
                      {ep.duration_seconds && (
                        <p style={{ fontSize: 9, color: 'rgba(43,58,90,0.4)', fontFamily: 'var(--font-body)', margin: 0 }}>{formatDuration(ep.duration_seconds)}</p>
                      )}
                    </div>
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

          {/* Topic tags */}
          {(story.tags ?? []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, color: 'rgba(43,58,90,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Topics
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(story.tags ?? []).map(tag => (
                  <span
                    key={tag}
                    style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, padding: '4px 10px', borderRadius: 2, border: '1px solid rgba(43,58,90,0.15)', color: '#2B3A5A', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ad zone */}
          <div style={{ border: '1px dashed rgba(43,58,90,0.2)', borderRadius: 2, padding: '24px 10px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.5)' }}>
            <span style={{ fontSize: 10, color: 'rgba(43,58,90,0.3)', fontFamily: 'var(--font-condensed)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Ad Zone · 260×200
            </span>
          </div>
        </div>
      </div>

      {/* 4. Related articles */}
      {(related ?? []).length > 0 && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 40px' }}>
          {/* Section head */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 2, backgroundColor: '#2B3A5A', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 13, color: '#2B3A5A', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              More in {pLabel}
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(43,58,90,0.15)' }} />
          </div>
          {/* 3-column grid */}
          <div className="media-related-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {(related ?? []).map((r: RelatedStory) => (
              <Link key={r.id} href={`/media/${r.pillar}/${r.slug}`} style={{ textDecoration: 'none', display: 'block', backgroundColor: '#fff', border: '0.5px solid rgba(43,58,90,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ aspectRatio: '16/9', backgroundColor: '#2B3A5A', overflow: 'hidden' }}>
                  {r.featured_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.featured_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2B3A5A, #1a2540)' }} />
                  )}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <p style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-condensed)', color: pColor, letterSpacing: '0.06em', marginBottom: 4 }}>
                    {pLabel}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 15, color: '#2B3A5A', lineHeight: 1.3, margin: '0 0 4px' }}>
                    {r.title}
                  </h3>
                  <span style={{ fontSize: 10, color: 'rgba(43,58,90,0.4)', fontFamily: 'var(--font-body)' }}>
                    {formatDate(r.published_at)} · {readTime(r.body)} min read
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Prose styles + responsive */}
      <style>{`
        .media-prose {
          font-family: var(--font-serif);
          font-size: 14px;
          line-height: 1.85;
          color: #1A1A1A;
          margin-top: 20px;
        }
        .media-prose h2 {
          font-family: var(--font-condensed);
          font-weight: 800;
          font-size: 22px;
          color: #2B3A5A;
          text-transform: uppercase;
          margin: 24px 0 10px;
          line-height: 1.2;
        }
        .media-prose h3 {
          font-family: var(--font-condensed);
          font-weight: 700;
          font-size: 18px;
          color: #2B3A5A;
          margin: 20px 0 8px;
        }
        .media-prose p {
          margin-bottom: 18px;
        }
        .media-prose blockquote {
          border-left: 4px solid #C9302A;
          padding: 12px 16px;
          background: #F9F6F1;
          font-style: italic;
          font-size: 15px;
          margin: 20px 0;
        }
        .media-prose ul, .media-prose ol {
          margin: 12px 0;
          padding-left: 20px;
        }
        .media-prose li {
          margin-bottom: 6px;
        }
        .media-prose a {
          color: #C9302A;
          text-decoration: underline;
        }
        .media-prose img {
          max-width: 100%;
          border-radius: 2px;
          margin: 16px 0;
        }
        @media (max-width: 767px) {
          .media-detail-grid {
            grid-template-columns: 1fr !important;
          }
          .media-related-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  )
}
