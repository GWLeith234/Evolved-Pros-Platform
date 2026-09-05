import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { marked } from 'marked'
import { sanitizeMediaHtml } from '@/lib/security/html'
import { adminClient } from '@/lib/supabase/admin'
import { resolveAuthorProfile } from '@/lib/media/resolveAuthorProfile'
import { getPillarLabel, getPillarColor } from '@/lib/pillars'
import { mediaStoryHref } from '@/lib/media/paths'
import { StoryCommentsClient as StoryComments } from '../../MediaClientShims'
import { ArticleShareBar } from './ArticleShareBar'
import { MediaIabSlot } from '@/components/media/MediaIabSlot'
import { MediaLatestPodcast } from '@/components/media/MediaLatestPodcast'
import type { MediaRailEpisode } from '@/lib/media/podcastRail'
import { MEDIA_BRAND, mediaStoryTitle } from '@/lib/media/brand'
import { CANONICAL_ORIGIN, DEFAULT_OG_IMAGE, canonicalUrl, publicPageMetadata } from '@/lib/seo/canonical'
import { getActivePlatformAds } from '@/lib/cache/shared'
import { pickArticleAds } from '@/lib/sponsors/partners'
import { adMatchesSurface } from '@/lib/ads/iab'
import { layoutArticleBody, splitHtmlBlocks } from '@/lib/ads/rhythm'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

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

type Episode = MediaRailEpisode

// ── Helpers ─────────────────────────────────────────────────────────────────

async function fetchStory(pillar: string, slug: string): Promise<Story | null> {
  // Stories badged "ORIGINAL" land at /media/general/[slug] (the listing
  // builds that URL from `story.pillar ?? 'general'`). The DB stores those
  // rows as pillar IS NULL — match that explicitly so the route doesn't 404.
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

function readTime(body: string | null): number {
  if (!body) return 1
  return Math.max(1, Math.ceil(body.split(/\s+/).length / 200))
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ── Static params ───────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const { data } = await adminClient
    .from('media_stories')
    .select('pillar, slug')
    .eq('is_published', true)
  return (data ?? [])
    .filter(s => s.slug)
    // null pillar → 'general' (the URL slug used for ORIGINAL-badged stories).
    .map(s => ({ pillar: s.pillar ? String(s.pillar) : 'general', slug: String(s.slug) }))
}

// ── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { pillar: string; slug: string } }
): Promise<Metadata> {
  const story = await fetchStory(params.pillar, params.slug)
  if (!story) return {}

  const title = story.seo_title || mediaStoryTitle(story.title)
  const description = story.seo_description || story.excerpt || ''
  const image = story.featured_image_url || DEFAULT_OG_IMAGE

  return publicPageMetadata(`/media/${params.pillar}/${params.slug}`, {
    title,
    description,
    openGraph: {
      title, description, type: 'article',
      publishedTime: story.published_at ?? undefined,
      modifiedTime: story.updated_at ?? undefined,
      authors: [story.author ?? 'George Leith'],
      tags: story.tags ?? [],
      images: [{ url: image, width: 1200, height: 630, alt: story.title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  })
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
  const html = story.body ? sanitizeMediaHtml(await marked.parse(story.body)) : ''
  const catalog = ((await getActivePlatformAds()) as SponsorAd[]).filter(a => adMatchesSurface(a, 'media'))
  const articleAds = pickArticleAds(catalog)
  const articleChunks = layoutArticleBody(splitHtmlBlocks(html), articleAds.inBody)
  const insertedInBody = articleChunks.some(c => c.kind === 'ad')
  const hideRailOnMobile = insertedInBody
  const isOriginal = !story.pillar
  const pLabel = isOriginal ? 'Original' : getPillarLabel(story.pillar)
  const pColor = isOriginal ? 'var(--brand-gold)' : getPillarColor(story.pillar)
  const articleUrl = canonicalUrl(`/media/${params.pillar}/${params.slug}`)

  // media_stories.author is a byline string, not an FK. Resolve against
  // public.users by name (full_name / display_name / first+last). A miss is
  // fine — the photo is optional and the UI falls back to initials.
  const authorUser = await resolveAuthorProfile(story.author)
  const authorAvatar = authorUser?.avatar_url ?? null

  // Related stories: same pillar, exclude current
  const relatedQuery = adminClient
    .from('media_stories')
    .select('id, title, slug, pillar, featured_image_url, published_at, body')
    .eq('is_published', true)
    .neq('id', story.id)
    .order('published_at', { ascending: false })
    .limit(2)
  const { data: related } = params.pillar === 'general'
    ? await relatedQuery.is('pillar', null)
    : await relatedQuery.eq('pillar', params.pillar)

  // Latest 2 episodes for sidebar
  let episodes: Episode[] = []
  try {
    const { data } = await adminClient
      .from('episodes')
      .select('id, episode_number, title, slug, thumbnail_url, guest_image_url, youtube_url, duration_seconds')
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
    publisher: { '@type': 'Organization', name: 'Evolved Pros', url: CANONICAL_ORIGIN },
    datePublished: story.published_at, dateModified: story.updated_at,
    url: articleUrl, image: story.featured_image_url || DEFAULT_OG_IMAGE,
  }
  const breadcrumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: CANONICAL_ORIGIN },
      { '@type': 'ListItem', position: 2, name: MEDIA_BRAND, item: canonicalUrl('/media') },
      { '@type': 'ListItem', position: 3, name: pLabel, item: canonicalUrl(`/media/${params.pillar}`) },
      { '@type': 'ListItem', position: 4, name: story.title.slice(0, 50) },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* 1. Breadcrumb */}
      <nav className="media-detail-breadcrumb" style={{ padding: '8px 24px', fontFamily: 'var(--font-condensed)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(43,58,90,0.45)' }}>
        <Link href="/media" style={{ color: 'rgba(43,58,90,0.45)', textDecoration: 'none' }}>{MEDIA_BRAND}</Link>
        <span style={{ margin: '0 6px', color: 'var(--media-ink)' }}>/</span>
        <Link href={`/media?pillar=${params.pillar}`} style={{ color: pColor, textDecoration: 'none' }}>{pLabel}</Link>
        <span style={{ margin: '0 6px', color: 'var(--media-ink)' }}>/</span>
        <span style={{ color: 'rgba(43,58,90,0.6)' }}>{story.title.length > 40 ? story.title.slice(0, 40) + '...' : story.title}</span>
      </nav>

      {/* 2. Wide Hero */}
      <div
        className="media-detail-hero"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '100%',
          minHeight: 280,
          aspectRatio: '21/9',
          maxHeight: 380,
          backgroundImage: story.featured_image_url
            ? `url(${story.featured_image_url})`
            : 'linear-gradient(135deg, var(--media-hero-blue), var(--media-ink))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 30%, rgba(0,0,0,0.75))' }} />
        {/* Contents */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
            {!isOriginal && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--brand-gold)', display: 'inline-block' }} />
            )}
            <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 11, color: 'var(--brand-gold)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isOriginal ? 'Original' : pLabel}
            </span>
          </div>
          <h1 className="media-detail-title" style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, fontSize: 32, color: '#fff', lineHeight: 1.1, maxWidth: 680, margin: '0 0 8px', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
            {story.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {authorAvatar ? (
              <Image src={authorAvatar} alt={story.author ?? 'George Leith'} width={28} height={28} className="rounded-full object-cover" style={{ flexShrink: 0 }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: 'var(--media-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700, fontFamily: 'var(--font-condensed)', flexShrink: 0 }}>
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

          {/* Article body is the page. One late unit when inventory exists.
              Empty Advertisement boxes are not invented. */}
          <div className="media-prose">
            {articleChunks.length > 0 ? (
              articleChunks.map((chunk, idx) =>
                chunk.kind === 'ad' ? (
                  <div
                    key={`ad-${chunk.ad.id}-${idx}`}
                    data-media-ads="in-article"
                    style={{
                      margin: '28px 0',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <MediaIabSlot ad={chunk.ad} locationId="media-article" />
                  </div>
                ) : (
                  <div
                    key={`copy-${idx}`}
                    dangerouslySetInnerHTML={{ __html: chunk.html }}
                  />
                ),
              )
            ) : (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            )}
            {!insertedInBody && articleAds.inBody[0]?.image_url ? (
              <div
                data-media-ads="in-article-end"
                style={{
                  margin: '28px 0',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <MediaIabSlot ad={articleAds.inBody[0]} locationId="media-article-end" />
              </div>
            ) : null}
          </div>

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
              <Image src={authorAvatar} alt={story.author ?? 'George Leith'} width={80} height={80} className="rounded-full object-cover" style={{ margin: '0 auto 8px', display: 'block', border: '2px solid var(--paper-line)', backgroundColor: 'var(--paper)' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', backgroundColor: 'var(--media-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 24, color: '#fff', fontWeight: 700, fontFamily: 'var(--font-condensed)' }}>
                {(story.author ?? 'GL').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            )}
            <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 16, color: 'var(--media-ink)', margin: '0 0 2px' }}>
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
              style={{ display: 'block', width: '100%', textAlign: 'center', padding: '8px 0', backgroundColor: 'var(--brand-red)', color: '#fff', fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', borderRadius: 2, textDecoration: 'none' }}
            >
              Join Evolved Pros →
            </Link>
          </div>

          <MediaLatestPodcast episodes={episodes} variant="article" />

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
                    style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, padding: '4px 10px', borderRadius: 2, border: '1px solid rgba(43,58,90,0.15)', color: 'var(--media-ink)', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {articleAds.sidebar?.image_url ? (
            <div
              data-media-ads="article-rail"
              className={hideRailOnMobile ? 'media-article-rail media-article-rail--desktop' : 'media-article-rail'}
              style={{ position: 'sticky', top: 24 }}
            >
              <MediaIabSlot ad={articleAds.sidebar} locationId="media-article-rail" />
            </div>
          ) : null}
        </div>
      </div>

      {/* 4. Related articles */}
      {(related ?? []).length > 0 && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 40px' }}>
          {/* Section head */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 40, height: 2, backgroundColor: 'var(--media-ink)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 13, color: 'var(--media-ink)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              More in {pLabel}
            </span>
            <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(43,58,90,0.15)' }} />
          </div>
          <div className="media-related-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {(related ?? []).map((r: RelatedStory) => (
              <Link key={r.id} href={mediaStoryHref(r.pillar, r.slug)} style={{ textDecoration: 'none', display: 'block', backgroundColor: '#fff', border: '0.5px solid rgba(43,58,90,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', backgroundColor: 'var(--media-ink)', overflow: 'hidden' }}>
                  {r.featured_image_url ? (
                    <Image src={r.featured_image_url} alt="" fill sizes="(max-width: 767px) 100vw, 360px" className="object-cover" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--media-ink), var(--media-ink-deep))' }} />
                  )}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <p style={{ fontSize: 9, textTransform: 'uppercase', fontWeight: 700, fontFamily: 'var(--font-condensed)', color: pColor, letterSpacing: '0.06em', marginBottom: 4 }}>
                    {pLabel}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 15, color: 'var(--media-ink)', lineHeight: 1.3, margin: '0 0 4px' }}>
                    {r.title}
                  </h3>
                  <span style={{ fontSize: 10, color: 'rgba(43,58,90,0.4)', fontFamily: 'var(--font-body)' }}>
                    {formatDate(r.published_at)} · {readTime(r.body)} min read
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {articleAds.related?.image_url ? (
            <div
              data-media-ads="related"
              style={{ display: 'flex', justifyContent: 'center', marginTop: 20, minHeight: 250 }}
            >
              <MediaIabSlot ad={articleAds.related} locationId="media-related" />
            </div>
          ) : null}
        </div>
      )}

      {/* Prose styles + responsive */}
      <style>{`
        .media-prose {
          font-family: var(--font-serif);
          font-size: 16px;
          line-height: 1.85;
          color: var(--media-body-ink);
          margin-top: 20px;
        }
        @media (max-width: 767px) {
          .media-prose {
            font-size: 14px;
          }
        }
        .media-prose h2 {
          font-family: var(--font-condensed);
          font-weight: 800;
          font-size: 22px;
          color: var(--media-ink);
          text-transform: uppercase;
          margin: 24px 0 10px;
          line-height: 1.2;
        }
        .media-prose h3 {
          font-family: var(--font-condensed);
          font-weight: 700;
          font-size: 18px;
          color: var(--media-ink);
          margin: 20px 0 8px;
        }
        .media-prose p {
          margin-bottom: 18px;
          color: var(--media-body-ink);
        }
        .media-prose blockquote {
          border-left: 4px solid var(--brand-red);
          padding: 12px 16px;
          background: var(--media-cream-tint);
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
          color: var(--brand-red);
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
          /* In-body units already punctuate the story — don't stack the
             rail unit directly under the article when columns collapse. */
          .media-article-rail--desktop { display: none !important; }
        }
        /* MOBILE-MEDIA-FIX: at <640px the 32px headline + 24px gutters spill
           past the 375px viewport. Tighten gutters, shrink the headline, and
           allow long words to wrap. Body prose inherits the max-width:100%
           guard so figures/wide tokens can't extend past the article column. */
        @media (max-width: 639px) {
          .media-detail-breadcrumb { padding-left: 16px !important; padding-right: 16px !important; }
          .media-detail-hero { width: 100%; max-width: 100%; }
          .media-detail-hero > div[style*="position: absolute"]:last-child { padding: 16px !important; }
          .media-detail-title { font-size: 22px !important; max-width: 100% !important; }
          .media-detail-grid { padding-left: 16px !important; padding-right: 16px !important; max-width: 100% !important; }
          .media-zone-c { padding-left: 16px !important; padding-right: 16px !important; max-width: 100% !important; }
          .media-prose { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
          .media-prose img, .media-prose iframe, .media-prose table { max-width: 100%; height: auto; }
        }
      `}</style>
    </>
  )
}
