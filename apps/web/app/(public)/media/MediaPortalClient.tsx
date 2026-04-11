'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getPillarLabel, getPillarColor } from '@/lib/pillars'

// ── Types ──────────────────────────────────────────────────────────────────

export interface MediaStory {
  id: string; title: string; slug: string; excerpt: string | null
  pillar: string | null; story_type: string; featured_image_url: string | null
  author: string | null; published_at: string | null; body: string | null
  views: number
}

export interface PillarSection {
  key: string; label: string; color: string; stories: MediaStory[]
}

// ── Constants ──────────────────────────────────────────────────────────────

const PILLAR_PILLS = [
  { key: 'all', label: 'All' },
  { key: 'foundation', label: 'Foundation' },
  { key: 'identity', label: 'Identity' },
  { key: 'mental-toughness', label: 'Mental Toughness' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'accountability', label: 'Accountability' },
  { key: 'execution', label: 'Execution' },
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function readTime(body: string | null): string {
  if (!body) return '1 min'
  return `${Math.max(1, Math.round(body.split(/\s+/).length / 200))} min`
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function pColor(p: string | null): string { return getPillarColor(p) }
function pLabel(p: string | null): string { return getPillarLabel(p) }

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ── Main Component ──────────────────────────────────────────────────────────

export function MediaPortalClient({
  featured, sidebar, sections, trending,
}: {
  featured: MediaStory | null
  sidebar: MediaStory[]
  sections: PillarSection[]
  trending: MediaStory[]
}) {
  const [activePillar, setActivePillar] = useState('all')
  const filtered = activePillar === 'all' ? sections : sections.filter(s => s.key === activePillar)

  return (
    <div style={{ backgroundColor: '#F5F2EC', minHeight: '100vh' }}>

      {/* ── SECTION 1: TOP UTILITY BAR ── */}
      <div className="flex items-center justify-between px-6" style={{ backgroundColor: '#0A0F18', padding: '6px 24px' }}>
        <span style={{ fontSize: 10, color: 'rgba(245,240,232,.4)', fontFamily: 'sans-serif' }}>
          {formatToday()} &middot; evolvedpros.com
        </span>
        <div className="flex items-center" style={{ gap: 14 }}>
          {[
            { label: 'Podcast', href: '/podcast' },
            { label: 'Events', href: '/events' },
            { label: 'About', href: '/about' },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{ fontSize: 10, color: 'rgba(245,240,232,.45)', fontFamily: 'sans-serif', textDecoration: 'none' }}>{l.label}</Link>
          ))}
          <Link href="/login?mode=signup" style={{ fontSize: 10, fontWeight: 500, color: '#fff', backgroundColor: '#C9302A', padding: '3px 10px', borderRadius: 3, fontFamily: 'sans-serif', textDecoration: 'none' }}>Join free</Link>
        </div>
      </div>

      {/* ── SECTION 2: MASTHEAD ── */}
      <div className="flex items-end justify-between px-6" style={{ backgroundColor: '#fff', borderBottom: '3px solid #0A0F18', padding: '14px 24px' }}>
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 500, color: '#0A0F18' }}>
            Evolved Pros<span style={{ color: '#C9302A' }}> Media</span>
          </div>
          <div style={{ fontSize: 10, color: 'rgba(10,15,24,.45)', letterSpacing: '.08em', textTransform: 'uppercase', fontFamily: 'sans-serif', marginTop: 2 }}>
            PIONEER DRIVER &middot; SALES & PERSONAL DEVELOPMENT INTELLIGENCE
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(10,15,24,.6)', fontFamily: 'sans-serif' }}>{formatDate()}</div>
          <div style={{ fontSize: 10, color: 'rgba(10,15,24,.4)', fontFamily: 'sans-serif' }}>Powered by Evolved Pros</div>
        </div>
      </div>

      {/* ── SECTION 3: LEADERBOARD AD ZONE ── */}
      <div className="hidden md:flex items-center justify-center" style={{ backgroundColor: '#fff', borderTop: '0.5px solid rgba(10,15,24,.1)', borderBottom: '0.5px solid rgba(10,15,24,.1)', padding: '8px 24px', gap: 12 }}>
        <div style={{ maxWidth: 728, width: '100%', height: 60, backgroundColor: 'rgba(10,15,24,.02)', border: '0.5px solid rgba(10,15,24,.05)', borderRadius: 4 }} />
      </div>

      {/* ── SECTION 4: PILLAR SECTION NAV ── */}
      <div className="overflow-x-auto" style={{ backgroundColor: '#0A0F18', padding: '0 24px' }}>
        <div className="flex items-stretch" style={{ gap: 0 }}>
          {PILLAR_PILLS.map((p, i) => (
            <div key={p.key} className="flex items-center">
              {i > 0 && <div style={{ width: 0.5, height: 14, backgroundColor: 'rgba(255,255,255,.1)' }} />}
              <button
                type="button"
                onClick={() => setActivePillar(p.key)}
                style={{
                  padding: '10px 13px', fontSize: 11, fontFamily: 'sans-serif', border: 'none', cursor: 'pointer',
                  backgroundColor: 'transparent', whiteSpace: 'nowrap',
                  color: activePillar === p.key ? '#F5F0E8' : 'rgba(245,240,232,.5)',
                  borderBottom: activePillar === p.key ? '2px solid #C9302A' : '2px solid transparent',
                }}
              >
                {p.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 5: MAIN BODY ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px' }}>
        <div className="grid gap-0" style={{ gridTemplateColumns: '1fr 300px' }}>

          {/* ── LEFT CONTENT COLUMN ── */}
          <div className="md:pr-5">

            {/* FEATURED HERO GRID */}
            {featured && activePillar === 'all' && (
              <div className="grid gap-px mb-5" style={{ gridTemplateColumns: '1fr 1fr', backgroundColor: 'rgba(10,15,24,.1)', border: '0.5px solid rgba(10,15,24,.1)' }}>
                {/* Main featured */}
                <Link href={`/media/${featured.pillar}/${featured.slug}`} className="block" style={{ gridRow: 'span 2', backgroundColor: '#fff', textDecoration: 'none' }}>
                  <div className="relative" style={{ height: 200, backgroundColor: '#1A2535' }}>
                    {featured.featured_image_url ? (
                      <img src={featured.featured_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><span style={{ fontSize: 9, textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', fontFamily: 'sans-serif' }}>Featured story</span></div>
                    )}
                    <div className="absolute top-0 left-0" style={{ backgroundColor: '#C9302A', color: '#fff', fontSize: 8, fontWeight: 500, textTransform: 'uppercase', padding: '3px 8px', fontFamily: 'sans-serif' }}>Featured</div>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', color: pColor(featured.pillar), fontWeight: 500, fontFamily: 'sans-serif', marginBottom: 4 }}>{pLabel(featured.pillar)}</div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 500, color: '#0A0F18', lineHeight: 1.3, marginBottom: 6 }}>{featured.title}</div>
                    {featured.excerpt && <div style={{ fontSize: 12, color: 'rgba(10,15,24,.6)', lineHeight: 1.6, fontFamily: 'sans-serif', marginBottom: 6 }}>{featured.excerpt}</div>}
                    <div style={{ fontSize: 10, color: 'rgba(10,15,24,.4)', fontFamily: 'sans-serif' }}>{featured.author ?? 'George Leith'} &middot; {readTime(featured.body)} read &middot; {timeAgo(featured.published_at)}</div>
                  </div>
                </Link>
                {/* Side stories */}
                {sidebar.slice(0, 2).map(s => (
                  <Link key={s.id} href={`/media/${s.pillar}/${s.slug}`} className="block" style={{ backgroundColor: '#fff', textDecoration: 'none', padding: 12 }}>
                    <div className="relative" style={{ height: 90, backgroundColor: '#1A2535', margin: '-12px -12px 10px', overflow: 'hidden' }}>
                      {s.featured_image_url ? <img src={s.featured_image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                    </div>
                    <div style={{ fontSize: 8, textTransform: 'uppercase', color: pColor(s.pillar), fontWeight: 500, fontFamily: 'sans-serif', marginBottom: 3 }}>{pLabel(s.pillar)}</div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#0A0F18', lineHeight: 1.35, fontFamily: 'sans-serif', marginBottom: 4 }}>{s.title}</div>
                    <div style={{ fontSize: 9, color: 'rgba(10,15,24,.4)', fontFamily: 'sans-serif' }}>{s.author ?? 'George Leith'} &middot; {readTime(s.body)} read</div>
                  </Link>
                ))}
              </div>
            )}

            {/* PILLAR SECTIONS */}
            {filtered.map((section, idx) => (
              <div key={section.key}>
                {/* Inline ad after 2nd section */}
                {idx === 2 && activePillar === 'all' && (
                  <div className="hidden md:block" style={{ height: 80, backgroundColor: 'rgba(10,15,24,.02)', border: '0.5px solid rgba(10,15,24,.05)', borderRadius: 4, margin: '6px 0 20px' }} />
                )}

                {/* Section header */}
                <div className="flex items-center justify-between" style={{ padding: '7px 0', borderTop: `2px solid ${section.color}`, marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#0A0F18', fontFamily: 'sans-serif' }}>{section.label}</span>
                  <span style={{ fontSize: 10, color: '#C9302A', fontFamily: 'sans-serif' }}>More in {section.label} &rarr;</span>
                </div>

                {/* Story row: 1 large + 2 small */}
                <div className="grid gap-2.5 mb-5" style={{ gridTemplateColumns: '2fr 1fr' }}>
                  {section.stories[0] && (
                    <Link href={`/media/${section.stories[0].pillar}/${section.stories[0].slug}`} className="block" style={{ backgroundColor: '#fff', border: '0.5px solid rgba(10,15,24,.08)', textDecoration: 'none' }}>
                      <div style={{ height: 110, backgroundColor: '#E8E4DB', overflow: 'hidden' }}>
                        {section.stories[0].featured_image_url && <img src={section.stories[0].featured_image_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div style={{ padding: '9px 10px' }}>
                        <div style={{ fontSize: 8, textTransform: 'uppercase', color: section.color, fontWeight: 500, fontFamily: 'sans-serif', marginBottom: 3 }}>{section.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#0A0F18', lineHeight: 1.35, fontFamily: 'sans-serif', marginBottom: 4 }}>{section.stories[0].title}</div>
                        <div style={{ fontSize: 9, color: 'rgba(10,15,24,.4)', fontFamily: 'sans-serif' }}>{readTime(section.stories[0].body)} read &middot; {timeAgo(section.stories[0].published_at)}</div>
                      </div>
                    </Link>
                  )}
                  <div className="flex flex-col gap-2.5">
                    {section.stories.slice(1, 3).map(s => (
                      <Link key={s.id} href={`/media/${s.pillar}/${s.slug}`} className="block" style={{ backgroundColor: '#fff', border: '0.5px solid rgba(10,15,24,.08)', textDecoration: 'none' }}>
                        <div style={{ height: 72, backgroundColor: '#E8E4DB', overflow: 'hidden' }}>
                          {s.featured_image_url && <img src={s.featured_image_url} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div style={{ padding: '9px 10px' }}>
                          <div style={{ fontSize: 8, textTransform: 'uppercase', color: section.color, fontWeight: 500, fontFamily: 'sans-serif', marginBottom: 2 }}>{section.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: '#0A0F18', lineHeight: 1.35, fontFamily: 'sans-serif', marginBottom: 3 }}>{s.title}</div>
                          <div style={{ fontSize: 9, color: 'rgba(10,15,24,.4)', fontFamily: 'sans-serif' }}>{readTime(s.body)} read</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(10,15,24,.35)', fontFamily: 'sans-serif' }}>No published stories in this category yet.</span>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="hidden md:block" style={{ paddingLeft: 20 }}>

            {/* 300x250 Ad */}
            <div style={{ height: 250, backgroundColor: 'rgba(10,15,24,.02)', border: '0.5px solid rgba(10,15,24,.05)', borderRadius: 4, marginBottom: 14 }} />

            {/* Trending Now */}
            {trending.length > 0 && (
            <div style={{ backgroundColor: '#fff', border: '0.5px solid rgba(10,15,24,.08)', marginBottom: 14 }}>
              <div style={{ padding: '9px 12px', borderBottom: '2px solid #0A0F18' }}>
                <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', color: '#0A0F18', fontFamily: 'sans-serif' }}>Trending Now</span>
              </div>
              {trending.map((s, i) => (
                <Link key={s.id} href={`/media/${s.pillar}/${s.slug}`} className="flex items-start gap-2.5" style={{ padding: '9px 12px', borderBottom: '0.5px solid rgba(10,15,24,.07)', textDecoration: 'none' }}>
                  <span style={{ fontSize: 18, fontWeight: 500, color: 'rgba(10,15,24,.12)', fontFamily: 'sans-serif', lineHeight: 1, minWidth: 20 }}>{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 8, textTransform: 'uppercase', color: pColor(s.pillar), fontWeight: 500, fontFamily: 'sans-serif', marginBottom: 2 }}>{pLabel(s.pillar)}</div>
                    <div style={{ fontSize: 11, color: '#0A0F18', fontFamily: 'sans-serif', lineHeight: 1.35 }}>{s.title}</div>
                  </div>
                </Link>
              ))}
            </div>
            )}

            {/* Podcast Card */}
            <div style={{ backgroundColor: '#0A0F18', padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 8, textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', fontFamily: 'sans-serif', marginBottom: 6 }}>From the Podcast</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#C9A84C', fontFamily: 'sans-serif', marginBottom: 6 }}>Conquer Local Podcast</div>
              <div style={{ fontSize: 10, color: 'rgba(245,240,232,.5)', lineHeight: 1.5, fontFamily: 'sans-serif', marginBottom: 10 }}>The Conquer Local podcast &mdash; new episodes weekly.</div>
              <Link href="/podcast" className="block text-center" style={{ padding: 7, backgroundColor: '#C9302A', color: '#fff', fontSize: 10, fontWeight: 500, fontFamily: 'sans-serif', textDecoration: 'none' }}>Listen now &rarr;</Link>
            </div>

            {/* 160x200 Ad */}
            <div style={{ height: 200, backgroundColor: 'rgba(10,15,24,.02)', border: '0.5px solid rgba(10,15,24,.05)', borderRadius: 4, marginBottom: 14 }} />

            {/* Latest Podcast — hidden until real episode data is wired */}
          </div>
        </div>
      </div>

      {/* ── SECTION 6: FOOTER ── */}
      <div className="flex items-center justify-between px-6" style={{ backgroundColor: '#0A0F18', padding: '14px 24px', marginTop: 20 }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 500 }}>
          <span style={{ color: '#F5F0E8' }}>Evolved Pros</span><span style={{ color: '#C9302A' }}> Media</span>
        </span>
        <div className="flex items-center" style={{ gap: 14 }}>
          {[
            { label: 'About', href: '/about' },
            { label: 'Advertise', href: 'https://evolvedpros.com/media-kit', external: true },
            { label: 'Privacy', href: '/privacy' },
            { label: 'Contact', href: 'mailto:geoleith@gmail.com' },
          ].map(l => (
            <a key={l.label} href={l.href} target={l.external ? '_blank' : undefined} rel={l.external ? 'noopener noreferrer' : undefined} style={{ fontSize: 10, color: 'rgba(245,240,232,.4)', fontFamily: 'sans-serif', textDecoration: 'none' }}>{l.label}</a>
          ))}
        </div>
      </div>
    </div>
  )
}
