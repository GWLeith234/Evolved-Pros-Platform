'use client'

import { useState } from 'react'
import Link from 'next/link'

<<<<<<< HEAD
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
}

export interface PillarSection {
  key: string
  label: string
  subtitle: string
  color: string
  stories: MediaStory[]
=======
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

export const PILLAR_META: Record<string, { label: string; color: string }> = {
  foundation:         { label: 'Foundation',       color: '#FFA538' },
  identity:           { label: 'Identity',         color: '#A78BFA' },
  'mental-toughness': { label: 'Mental Toughness', color: '#F87171' },
  strategy:           { label: 'Strategy',         color: '#60A5FA' },
  accountability:     { label: 'Accountability',   color: '#C9A84C' },
  execution:          { label: 'Execution',        color: '#0ABFA3' },
>>>>>>> origin/claude/init-evolved-pros-platform-Q2oUw
}

const PILLAR_PILLS = [
  { key: 'all', label: 'All' },
  { key: 'foundation', label: 'Foundation' },
  { key: 'identity', label: 'Identity' },
  { key: 'mental-toughness', label: 'Mental Toughness' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'accountability', label: 'Accountability' },
  { key: 'execution', label: 'Execution' },
]

<<<<<<< HEAD
export const PILLAR_META: Record<string, { label: string; subtitle: string; color: string }> = {
  foundation:         { label: 'Foundation',       subtitle: 'Purpose \u00b7 Values \u00b7 Vision',            color: '#FFA538' },
  identity:           { label: 'Identity',         subtitle: 'Brand \u00b7 Story \u00b7 Presence',            color: '#A78BFA' },
  'mental-toughness': { label: 'Mental Toughness', subtitle: 'Resilience \u00b7 Mindset \u00b7 Pressure',     color: '#F87171' },
  strategy:           { label: 'Strategy',         subtitle: 'Planning \u00b7 Positioning \u00b7 Growth',     color: '#60A5FA' },
  accountability:     { label: 'Accountability',   subtitle: 'Ownership \u00b7 Feedback \u00b7 Standards',    color: '#C9A84C' },
  execution:          { label: 'Execution',        subtitle: 'Habits \u00b7 Systems \u00b7 Delivery',         color: '#0ABFA3' },
}
=======
// ── Helpers ─────────────────────────────────────────────────────────────────
>>>>>>> origin/claude/init-evolved-pros-platform-Q2oUw

function readTime(body: string | null): string {
  if (!body) return '1 min'
  return `${Math.max(1, Math.round(body.split(/\s+/).length / 200))} min`
}

<<<<<<< HEAD
function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function pillarColor(p: string | null): string { return PILLAR_META[p ?? '']?.color ?? '#7a8a96' }
function pillarLabel(p: string | null): string { return PILLAR_META[p ?? '']?.label ?? '' }

function LargeCard({ story }: { story: MediaStory }) {
  return (
    <Link href={`/media/${story.pillar}/${story.slug}`} className="block group" style={{ textDecoration: 'none' }}>
      <div className="bg-white rounded-lg overflow-hidden" style={{ border: '1px solid rgba(10,15,24,0.06)' }}>
        {story.featured_image_url && <div className="overflow-hidden" style={{ height: 140 }}><img src={story.featured_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /></div>}
        <div className="p-4">
          <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[9px] mb-1.5" style={{ color: pillarColor(story.pillar) }}>{pillarLabel(story.pillar)}</p>
          <h3 className="font-body font-semibold text-[15px] leading-snug mb-2 group-hover:text-[#C9302A] transition-colors" style={{ color: '#0A0F18' }}>{story.title}</h3>
          {story.excerpt && <p className="font-body text-[12px] leading-relaxed mb-2" style={{ color: 'rgba(10,15,24,0.5)' }}>{story.excerpt}</p>}
          <p className="font-condensed text-[10px]" style={{ color: 'rgba(10,15,24,0.35)' }}>{readTime(story.body)} read</p>
        </div>
      </div>
    </Link>
  )
}

function SmallCard({ story }: { story: MediaStory }) {
  return (
    <Link href={`/media/${story.pillar}/${story.slug}`} className="block group" style={{ textDecoration: 'none' }}>
      <div className="bg-white rounded-lg overflow-hidden flex" style={{ border: '1px solid rgba(10,15,24,0.06)' }}>
        {story.featured_image_url && <div className="flex-shrink-0 overflow-hidden" style={{ width: 100, height: 80 }}><img src={story.featured_image_url} alt="" className="w-full h-full object-cover" /></div>}
        <div className="p-3 flex-1 min-w-0">
          <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[8px] mb-1" style={{ color: pillarColor(story.pillar) }}>{pillarLabel(story.pillar)}</p>
          <h4 className="font-body font-semibold text-[13px] leading-snug truncate group-hover:text-[#C9302A] transition-colors" style={{ color: '#0A0F18' }}>{story.title}</h4>
          <p className="font-condensed text-[9px] mt-1" style={{ color: 'rgba(10,15,24,0.35)' }}>{readTime(story.body)} read</p>
        </div>
      </div>
    </Link>
  )
}

function SidebarRow({ story }: { story: MediaStory }) {
  return (
    <Link href={`/media/${story.pillar}/${story.slug}`} className="flex gap-3 py-2.5 group" style={{ textDecoration: 'none', borderBottom: '1px solid rgba(10,15,24,0.06)' }}>
      {story.featured_image_url && <div className="flex-shrink-0 rounded overflow-hidden" style={{ width: 56, height: 44 }}><img src={story.featured_image_url} alt="" className="w-full h-full object-cover" /></div>}
      <div className="flex-1 min-w-0">
        <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[8px] mb-0.5" style={{ color: pillarColor(story.pillar) }}>{pillarLabel(story.pillar)}</p>
        <h4 className="font-body font-semibold text-[12px] leading-snug truncate group-hover:text-[#C9302A] transition-colors" style={{ color: '#0A0F18' }}>{story.title}</h4>
      </div>
    </Link>
  )
}

export function MediaPortalClient({ featured, latest, sections }: { featured: MediaStory | null; latest: MediaStory[]; sections: PillarSection[] }) {
  const [activePillar, setActivePillar] = useState('all')
  const filteredSections = activePillar === 'all' ? sections : sections.filter(s => s.key === activePillar)

  return (
    <div style={{ backgroundColor: '#F7F4EF', minHeight: '100vh' }}>
      <header className="flex items-center justify-between px-6 py-3" style={{ backgroundColor: '#fff', borderBottom: '1px solid rgba(10,15,24,0.08)' }}>
        <Link href="/media" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <span className="font-condensed font-bold tracking-[0.18em] text-[13px]" style={{ color: '#0A0F18' }}>EVOLVED<span style={{ color: '#C9302A' }}>{'\u00b7'}</span>PROS</span>
          <span className="font-condensed text-[10px] tracking-[0.1em] uppercase" style={{ color: 'rgba(10,15,24,0.35)' }}>Evolved Media</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {PILLAR_PILLS.map(p => (
            <button key={p.key} type="button" onClick={() => setActivePillar(p.key)} className="font-condensed font-semibold uppercase tracking-[0.08em] text-[10px] px-3 py-1.5 rounded-full transition-all" style={{ backgroundColor: activePillar === p.key ? '#0A0F18' : 'transparent', color: activePillar === p.key ? '#F7F4EF' : 'rgba(10,15,24,0.45)' }}>{p.label}</button>
          ))}
        </nav>
        <Link href="/login?mode=signup" className="font-condensed font-bold uppercase tracking-[0.08em] text-[10px] px-3.5 py-1.5 rounded-full transition-opacity hover:opacity-80" style={{ backgroundColor: '#0A0F18', color: '#F7F4EF' }}>Join free</Link>
      </header>
      <div className="md:hidden overflow-x-auto px-4 py-2" style={{ borderBottom: '1px solid rgba(10,15,24,0.06)' }}>
        <div className="flex gap-1">
          {PILLAR_PILLS.map(p => (
            <button key={p.key} type="button" onClick={() => setActivePillar(p.key)} className="font-condensed font-semibold uppercase tracking-[0.08em] text-[10px] px-3 py-1.5 rounded-full whitespace-nowrap transition-all" style={{ backgroundColor: activePillar === p.key ? '#0A0F18' : 'transparent', color: activePillar === p.key ? '#F7F4EF' : 'rgba(10,15,24,0.45)' }}>{p.label}</button>
          ))}
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {featured && activePillar === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 mb-10">
            <Link href={`/media/${featured.pillar}/${featured.slug}`} className="block group" style={{ textDecoration: 'none' }}>
              <div className="relative rounded-lg overflow-hidden mb-4" style={{ height: 200 }}>
                {featured.featured_image_url ? (
                  <><img src={featured.featured_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /><div className="absolute top-3 left-3"><span className="font-condensed font-bold uppercase tracking-[0.1em] text-[8px] px-2 py-1 rounded" style={{ backgroundColor: 'rgba(10,15,24,0.7)', color: '#F7F4EF' }}>Evolved Media</span></div></>
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#E8E3DB' }}><span className="font-condensed text-[11px]" style={{ color: 'rgba(10,15,24,0.2)' }}>No image</span></div>
                )}
              </div>
              <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[9px] mb-1.5" style={{ color: pillarColor(featured.pillar) }}>{pillarLabel(featured.pillar)}</p>
              <h2 className="font-body font-bold text-[18px] leading-snug mb-2 group-hover:text-[#C9302A] transition-colors" style={{ color: '#0A0F18', fontFamily: 'Georgia, serif' }}>{featured.title}</h2>
              {featured.excerpt && <p className="font-body text-[13px] leading-relaxed mb-3" style={{ color: 'rgba(10,15,24,0.55)' }}>{featured.excerpt}</p>}
              <p className="font-condensed text-[10px]" style={{ color: 'rgba(10,15,24,0.35)' }}>{featured.author ?? 'George Leith'} {'\u00b7'} {formatDate(featured.published_at)} {'\u00b7'} {readTime(featured.body)} read</p>
            </Link>
            <div>
              <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[9px] mb-3" style={{ color: 'rgba(10,15,24,0.35)' }}>Latest Stories</p>
              <div className="flex flex-col">
                {latest.map(s => <SidebarRow key={s.id} story={s} />)}
                {latest.length === 0 && <p className="font-condensed text-[12px]" style={{ color: 'rgba(10,15,24,0.3)' }}>No stories yet.</p>}
              </div>
            </div>
          </div>
        )}
        {filteredSections.map((section, idx) => (
          <div key={section.key}>
            {idx === 2 && activePillar === 'all' && (
              <div className="rounded-xl px-8 py-10 mb-8 text-center" style={{ backgroundColor: '#0A0F18' }}>
                <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[10px] mb-2" style={{ color: '#C9A84C' }}>Go deeper on every story</p>
                <h3 className="font-body font-bold text-[20px] mb-2" style={{ color: '#F7F4EF', fontFamily: 'Georgia, serif' }}>The Academy puts the system behind the headlines.</h3>
                <p className="font-body text-[13px] mb-5 max-w-md mx-auto" style={{ color: 'rgba(245,240,232,0.5)' }}>VIP gets Pillars 1-3. Professional gets the full 6-pillar EVOLVED system.</p>
                <Link href="/pricing" className="inline-block font-condensed font-bold uppercase tracking-[0.1em] text-[12px] px-6 py-3 rounded transition-opacity hover:opacity-90" style={{ backgroundColor: '#C9302A', color: '#fff' }}>Join from $49/month</Link>
              </div>
            )}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 pl-4" style={{ borderLeft: `4px solid ${section.color}` }}>
                <div>
                  <h2 className="font-body font-semibold text-[13px]" style={{ color: '#0A0F18' }}>{section.label}</h2>
                  <p className="font-condensed text-[10px]" style={{ color: 'rgba(10,15,24,0.4)' }}>{section.subtitle}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
                {section.stories[0] && <LargeCard story={section.stories[0]} />}
                <div className="flex flex-col gap-4">{section.stories.slice(1, 3).map(s => <SmallCard key={s.id} story={s} />)}</div>
              </div>
            </div>
          </div>
        ))}
        {filteredSections.length === 0 && (
          <div className="py-16 text-center"><p className="font-condensed text-[13px]" style={{ color: 'rgba(10,15,24,0.35)' }}>No published stories in this category yet.</p></div>
        )}
      </div>
      <footer className="px-6 py-6 text-center" style={{ borderTop: '1px solid rgba(10,15,24,0.06)' }}>
        <p className="font-condensed text-[10px] tracking-wide" style={{ color: 'rgba(10,15,24,0.3)' }}>Evolved Media {'\u00b7'} Evolved Pros Platform</p>
      </footer>
=======
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

function pColor(p: string | null): string { return PILLAR_META[p ?? '']?.color ?? '#7a8a96' }
function pLabel(p: string | null): string { return PILLAR_META[p ?? '']?.label ?? '' }

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
        <span style={{ fontSize: 8, textTransform: 'uppercase', color: 'rgba(10,15,24,.3)', fontFamily: 'sans-serif' }}>Sponsored</span>
        <div className="flex flex-col items-center justify-center" style={{ maxWidth: 728, width: '100%', height: 60, backgroundColor: '#EDE8DF', border: '1px dashed rgba(10,15,24,.18)', borderRadius: 4 }}>
          <span style={{ fontSize: 10, color: 'rgba(10,15,24,.35)', fontFamily: 'sans-serif' }}>728 &times; 90 &mdash; Leaderboard &middot; Sponsor slot</span>
          <span style={{ fontSize: 9, color: '#C9302A', fontFamily: 'sans-serif' }}>Conquer Local Podcast Sponsor</span>
        </div>
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
                  <div className="hidden md:flex items-center justify-center" style={{ height: 80, backgroundColor: '#EDE8DF', border: '1px dashed rgba(10,15,24,.18)', margin: '6px 0 20px' }}>
                    <span style={{ fontSize: 10, color: 'rgba(10,15,24,.35)', fontFamily: 'sans-serif' }}>728 &times; 90 &mdash; Inline sponsor &middot; Between pillar sections</span>
                  </div>
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
            <div className="flex flex-col items-center justify-center" style={{ height: 250, backgroundColor: '#EDE8DF', border: '1px dashed rgba(10,15,24,.18)', marginBottom: 14 }}>
              <span style={{ fontSize: 10, color: 'rgba(10,15,24,.35)', fontFamily: 'sans-serif' }}>300 &times; 250 &middot; Sponsor slot</span>
              <span style={{ fontSize: 9, color: '#C9302A', fontFamily: 'sans-serif', marginTop: 4 }}>Conquer Local Sponsor</span>
            </div>

            {/* Trending Now */}
            <div style={{ backgroundColor: '#fff', border: '0.5px solid rgba(10,15,24,.08)', marginBottom: 14 }}>
              <div style={{ padding: '9px 12px', borderBottom: '2px solid #0A0F18' }}>
                <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', color: '#0A0F18', fontFamily: 'sans-serif' }}>Trending Now</span>
              </div>
              {trending.length === 0 && (
                <div style={{ padding: '12px', fontSize: 10, color: 'rgba(10,15,24,.4)', fontFamily: 'sans-serif' }}>No stories yet.</div>
              )}
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

            {/* Podcast Sponsor */}
            <div style={{ backgroundColor: '#0A0F18', padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 8, textTransform: 'uppercase', color: 'rgba(245,240,232,.3)', fontFamily: 'sans-serif', marginBottom: 6 }}>Presented By</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#C9A84C', fontFamily: 'sans-serif', marginBottom: 6 }}>Conquer Local Podcast</div>
              <div style={{ fontSize: 10, color: 'rgba(245,240,232,.5)', lineHeight: 1.5, fontFamily: 'sans-serif', marginBottom: 10 }}>George Leith interviews the world&apos;s top sales and marketing minds. New episodes every week.</div>
              <Link href="/podcast" className="block text-center" style={{ padding: 7, backgroundColor: '#C9302A', color: '#fff', fontSize: 10, fontWeight: 500, fontFamily: 'sans-serif', textDecoration: 'none' }}>Listen now &rarr;</Link>
            </div>

            {/* 160x200 Ad */}
            <div className="flex items-center justify-center" style={{ height: 200, backgroundColor: '#EDE8DF', border: '1px dashed rgba(10,15,24,.18)', marginBottom: 14 }}>
              <span style={{ fontSize: 10, color: 'rgba(10,15,24,.35)', fontFamily: 'sans-serif' }}>160 &times; 200 &middot; Secondary sponsor</span>
            </div>

            {/* Latest Podcast */}
            <div style={{ backgroundColor: '#fff', border: '0.5px solid rgba(10,15,24,.08)' }}>
              <div style={{ padding: '9px 12px', borderBottom: '2px solid #0A0F18' }}>
                <span style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', color: '#0A0F18', fontFamily: 'sans-serif' }}>Latest Podcast</span>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 8, textTransform: 'uppercase', color: '#C9A84C', fontWeight: 500, fontFamily: 'sans-serif', marginBottom: 4 }}>Conquer Local &middot; Latest</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#0A0F18', fontFamily: 'sans-serif', lineHeight: 1.35, marginBottom: 4 }}>Latest episode placeholder</div>
                <div style={{ fontSize: 9, color: 'rgba(10,15,24,.4)', fontFamily: 'sans-serif' }}>Listen &middot; 45 min</div>
              </div>
            </div>
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
>>>>>>> origin/claude/init-evolved-pros-platform-Q2oUw
    </div>
  )
}
