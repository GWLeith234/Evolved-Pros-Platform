import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { marked } from 'marked'
import { adminClient } from '@/lib/supabase/admin'
import { getPillarLabel, getPillarColor } from '@/lib/pillars'
import { StoryComments } from '@/components/media/StoryComments'

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

function pillarColor(pillar: string | null): string {
  return getPillarColor(pillar)
}

function pillarLabel(pillar: string | null): string {
  return getPillarLabel(pillar)
}

// ── Static params ───────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const { data } = await adminClient
    .from('media_stories')
    .select('pillar, slug')
    .eq('is_published', true)
  return (data ?? []).map(s => ({ pillar: s.pillar!, slug: s.slug }))
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
      title,
      description,
      url,
      type: 'article',
      publishedTime: story.published_at ?? undefined,
      modifiedTime: story.updated_at ?? undefined,
      authors: [story.author ?? 'George Leith'],
      tags: story.tags,
      images: [{ url: image, width: 1200, height: 630, alt: story.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function StoryPage({
  params,
}: {
  params: { pillar: string; slug: string }
}) {
  const story = await fetchStory(params.pillar, params.slug)
  if (!story) notFound()

  // Redirect type: send to source URL
  if (story.story_type === 'redirect' && story.source_url) {
    redirect(story.source_url)
  }

  const minutes = readTime(story.body)
  const html = story.body ? marked.parse(story.body) : ''

  // Related stories: same pillar, exclude current
  const { data: related } = await adminClient
    .from('media_stories')
    .select('id, title, slug, pillar, featured_image_url, published_at, body')
    .eq('pillar', params.pillar)
    .eq('is_published', true)
    .neq('id', story.id)
    .order('published_at', { ascending: false })
    .limit(3)

  const pLabel = pillarLabel(story.pillar)
  const pColor = pillarColor(story.pillar)

  // JSON-LD
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: story.title,
    description: story.excerpt,
    author: { '@type': 'Person', name: story.author ?? 'George Leith' },
    publisher: {
      '@type': 'Organization',
      name: 'Evolved Pros',
      url: 'https://platform.evolvedpros.com',
    },
    datePublished: story.published_at,
    dateModified: story.updated_at,
    url: `https://platform.evolvedpros.com/media/${params.pillar}/${params.slug}`,
    image: story.featured_image_url || '/og-default.png',
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://platform.evolvedpros.com' },
      { '@type': 'ListItem', position: 2, name: 'Evolved Media', item: 'https://platform.evolvedpros.com/media' },
      { '@type': 'ListItem', position: 3, name: pLabel, item: `https://platform.evolvedpros.com/media/${params.pillar}` },
      { '@type': 'ListItem', position: 4, name: story.title.slice(0, 50) },
    ],
  }

  return (
    <div style={{ backgroundColor: '#F7F4EF', minHeight: '100vh' }}>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3"
        style={{ backgroundColor: '#fff', borderBottom: '1px solid rgba(10,15,24,0.08)' }}
      >
        <Link href="/media" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <span className="font-condensed font-bold tracking-[0.18em] text-[13px]" style={{ color: '#0A0F18' }}>
            EVOLVED<span style={{ color: '#C9302A' }}>&middot;</span>PROS
          </span>
          <span className="font-condensed text-[10px] tracking-[0.1em] uppercase" style={{ color: 'rgba(10,15,24,0.35)' }}>
            Evolved Media
          </span>
        </Link>
        <Link
          href="/login?mode=signup"
          className="font-condensed font-bold uppercase tracking-[0.08em] text-[10px] px-3.5 py-1.5 rounded-full transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#0A0F18', color: '#F7F4EF' }}
        >
          Join free
        </Link>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 mb-6 text-[11px] font-condensed" style={{ color: 'rgba(10,15,24,0.4)' }}>
          <Link href="/media" className="hover:underline" style={{ color: 'rgba(10,15,24,0.4)' }}>Media</Link>
          <span>&rsaquo;</span>
          <Link href={`/media?pillar=${params.pillar}`} className="hover:underline" style={{ color: pColor }}>{pLabel}</Link>
          <span>&rsaquo;</span>
          <span style={{ color: 'rgba(10,15,24,0.6)' }}>{story.title.length > 40 ? story.title.slice(0, 40) + '...' : story.title}</span>
        </nav>

        {/* Pillar + meta */}
        <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[10px] mb-2" style={{ color: pColor }}>
          {pLabel}
        </p>

        <h1 className="font-bold text-[28px] sm:text-[34px] leading-tight mb-4" style={{ color: '#0A0F18', fontFamily: 'Georgia, serif' }}>
          {story.title}
        </h1>

        {story.excerpt && (
          <p className="font-body text-[15px] leading-relaxed mb-5" style={{ color: 'rgba(10,15,24,0.6)' }}>
            {story.excerpt}
          </p>
        )}

        <div className="flex items-center gap-3 mb-8 pb-6" style={{ borderBottom: '1px solid rgba(10,15,24,0.08)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-condensed font-bold text-[11px]" style={{ backgroundColor: pColor, color: '#fff' }}>
            {(story.author ?? 'GL').split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="font-body font-semibold text-[13px]" style={{ color: '#0A0F18' }}>
              {story.author ?? 'George Leith'}
            </p>
            <p className="font-condensed text-[10px]" style={{ color: 'rgba(10,15,24,0.4)' }}>
              {formatDate(story.published_at)} &middot; {minutes} min read
            </p>
          </div>
        </div>

        {/* Featured image */}
        {story.featured_image_url && (
          <div className="rounded-lg overflow-hidden mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.featured_image_url} alt={story.title} className="w-full" style={{ maxHeight: 400, objectFit: 'cover' }} />
          </div>
        )}

        {/* Pioneer spin source attribution */}
        {story.story_type === 'pioneer_spin' && story.source_name && (
          <div
            className="rounded-lg px-4 py-3 mb-8 flex items-center gap-2"
            style={{ backgroundColor: 'rgba(10,15,24,0.03)', border: '1px solid rgba(10,15,24,0.06)' }}
          >
            <span className="font-condensed font-bold uppercase tracking-[0.1em] text-[9px]" style={{ color: 'rgba(10,15,24,0.35)' }}>
              Pioneer Driver
            </span>
            <span className="font-body text-[12px]" style={{ color: 'rgba(10,15,24,0.5)' }}>
              Inspired by{' '}
              {story.source_url ? (
                <a href={story.source_url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: pColor }}>
                  {story.source_name}
                </a>
              ) : (
                story.source_name
              )}
            </span>
          </div>
        )}

        {/* Article body */}
        <div
          className="prose prose-stone max-w-none font-body text-[15px] leading-[1.8]"
          style={{ color: 'rgba(10,15,24,0.8)' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Tags */}
        {story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6" style={{ borderTop: '1px solid rgba(10,15,24,0.06)' }}>
            {story.tags.map(tag => (
              <span
                key={tag}
                className="font-condensed font-semibold uppercase tracking-[0.1em] text-[9px] px-2.5 py-1 rounded"
                style={{ backgroundColor: 'rgba(10,15,24,0.04)', color: 'rgba(10,15,24,0.45)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments */}
        <StoryComments storyId={story.id} pillarColor={pColor} />
      </article>

      {/* Related stories */}
      {(related ?? []).length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
          <h2
            className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px] mb-4 pl-4"
            style={{ color: 'rgba(10,15,24,0.35)', borderLeft: `4px solid ${pColor}` }}
          >
            More in {pLabel}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(related ?? []).map((r: any) => (
              <Link
                key={r.id}
                href={`/media/${r.pillar}/${r.slug}`}
                className="block group bg-white rounded-lg overflow-hidden"
                style={{ border: '1px solid rgba(10,15,24,0.06)', textDecoration: 'none' }}
              >
                {r.featured_image_url && (
                  <div className="overflow-hidden" style={{ height: 100 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.featured_image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-3">
                  <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[8px] mb-1" style={{ color: pColor }}>
                    {pLabel}
                  </p>
                  <h3 className="font-body font-semibold text-[13px] leading-snug group-hover:text-[#C9302A] transition-colors" style={{ color: '#0A0F18' }}>
                    {r.title}
                  </h3>
                  <p className="font-condensed text-[9px] mt-1" style={{ color: 'rgba(10,15,24,0.35)' }}>
                    {readTime(r.body)} min read
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Upsell */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
        <div className="rounded-xl px-8 py-8 text-center" style={{ backgroundColor: '#0A0F18' }}>
          <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[10px] mb-2" style={{ color: '#C9A84C' }}>
            Go deeper
          </p>
          <h3 className="font-bold text-[18px] mb-2" style={{ color: '#F7F4EF', fontFamily: 'Georgia, serif' }}>
            The Academy puts the system behind the headlines.
          </h3>
          <p className="font-body text-[13px] mb-4" style={{ color: 'rgba(245,240,232,0.5)' }}>
            VIP gets Pillars 1&ndash;3. Professional gets the full 6-pillar EVOLVED system.
          </p>
          <Link
            href="/pricing"
            className="inline-block font-condensed font-bold uppercase tracking-[0.1em] text-[12px] px-6 py-3 rounded transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C9302A', color: '#fff' }}
          >
            Join from $49/month
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-6 text-center" style={{ borderTop: '1px solid rgba(10,15,24,0.06)' }}>
        <p className="font-condensed text-[10px] tracking-wide" style={{ color: 'rgba(10,15,24,0.3)' }}>
          Evolved Media &middot; Evolved Pros Platform
        </p>
      </footer>
    </div>
  )
}
