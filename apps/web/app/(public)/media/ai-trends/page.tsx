import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { adminClient } from '@/lib/supabase/admin'

export const revalidate = 120

export const metadata: Metadata = {
  title: 'AI Trends — Evolved Media',
  description: 'Artificial intelligence trends shaping sales, marketing, and business strategy.',
}

interface Article {
  id: string; title: string; slug: string; featured_image_url: string | null
  pillar: string | null; section: string | null; published_at: string | null
  body: string | null; author: string | null; excerpt: string | null
}

function fmtDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function readTime(body: string | null): string {
  if (!body) return '1 min'
  return `${Math.max(1, Math.round(body.split(/\s+/).length / 200))} min`
}

async function fetchArticles(): Promise<Article[]> {
  const { data, error } = await adminClient
    .from('media_stories')
    .select('id, title, slug, featured_image_url, pillar, section, published_at, body, author, excerpt')
    .eq('is_published', true)
    .eq('section', 'ai-trends')
    .order('published_at', { ascending: false })
    .limit(12)

  if (!error && data && data.length > 0) return data as Article[]

  const { data: fallback } = await adminClient
    .from('media_stories')
    .select('id, title, slug, featured_image_url, pillar, section, published_at, body, author, excerpt')
    .eq('is_published', true)
    .contains('tags', ['ai-trends'])
    .order('published_at', { ascending: false })
    .limit(12)

  return (fallback ?? []) as Article[]
}

export default async function AiTrendsPage() {
  const articles = await fetchArticles()
  const featured = articles[0] ?? null
  const grid = articles.slice(1)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 40px' }}>
      {/* Section band */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--font-condensed)', fontWeight: 700, fontSize: 10, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>Evolved Media</p>
        <h1 style={{ fontFamily: 'var(--font-abril, var(--font-condensed))', fontWeight: 400, fontSize: 36, color: '#2B3A5A', lineHeight: 1.1, margin: 0 }}>AI Trends</h1>
      </div>

      {/* Featured hero */}
      {featured && (
        <Link href={`/media/${featured.pillar ?? 'general'}/${featured.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 20 }}>
          <div style={{ position: 'relative', aspectRatio: '21/9', borderRadius: 4, overflow: 'hidden', backgroundColor: '#2B3A5A' }}>
            {featured.featured_image_url ? (
              <Image src={featured.featured_image_url} alt="" fill priority sizes="(max-width: 1100px) 100vw, 1100px" className="object-cover" />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2B3A5A, #1a2540)' }} />
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 20px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
              <h2 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 900, fontSize: 24, color: '#fff', lineHeight: 1.15, margin: '0 0 6px', maxWidth: 600 }}>{featured.title}</h2>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-body)' }}>{featured.author ?? 'George Leith'} · {fmtDate(featured.published_at)} · {readTime(featured.body)} read</span>
            </div>
          </div>
        </Link>
      )}

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 2, backgroundColor: '#2B3A5A', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 13, color: '#2B3A5A', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Latest in AI Trends</span>
        <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(43,58,90,0.15)' }} />
      </div>

      {/* Article grid */}
      {grid.length > 0 ? (
        <div className="section-article-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {grid.map(a => (
            <Link key={a.id} href={`/media/${a.pillar ?? 'general'}/${a.slug}`} style={{ textDecoration: 'none', display: 'block', backgroundColor: '#fff', border: '0.5px solid rgba(43,58,90,0.1)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', backgroundColor: '#2B3A5A', overflow: 'hidden' }}>
                {a.featured_image_url ? (
                  <Image src={a.featured_image_url} alt="" fill sizes="(max-width: 767px) 100vw, 360px" className="object-cover" />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2B3A5A, #1a2540)' }} />
                )}
              </div>
              <div style={{ padding: '10px 12px 12px' }}>
                <h3 style={{ fontFamily: 'var(--font-condensed)', fontWeight: 800, fontSize: 15, color: '#2B3A5A', lineHeight: 1.3, margin: '0 0 4px' }}>{a.title}</h3>
                {a.excerpt && <p style={{ fontSize: 11, color: 'rgba(43,58,90,0.55)', lineHeight: 1.5, margin: '0 0 6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.excerpt}</p>}
                <span style={{ fontSize: 10, color: 'rgba(43,58,90,0.4)', fontFamily: 'var(--font-body)' }}>{fmtDate(a.published_at)} · {readTime(a.body)} read</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontFamily: 'var(--font-logo)', fontSize: 18, color: 'rgba(43,58,90,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>More stories coming soon</p>
        </div>
      )}

      <style>{`
        @media (max-width: 767px) {
          .section-article-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
