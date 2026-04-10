'use client'

import { useState } from 'react'
import Link from 'next/link'

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
}

export interface PillarSection {
  key: string
  label: string
  subtitle: string
  color: string
  stories: MediaStory[]
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

export const PILLAR_META: Record<string, { label: string; subtitle: string; color: string }> = {
  foundation:         { label: 'Foundation',       subtitle: 'Purpose \u00b7 Values \u00b7 Vision',            color: '#FFA538' },
  identity:           { label: 'Identity',         subtitle: 'Brand \u00b7 Story \u00b7 Presence',            color: '#A78BFA' },
  'mental-toughness': { label: 'Mental Toughness', subtitle: 'Resilience \u00b7 Mindset \u00b7 Pressure',     color: '#F87171' },
  strategy:           { label: 'Strategy',         subtitle: 'Planning \u00b7 Positioning \u00b7 Growth',     color: '#60A5FA' },
  accountability:     { label: 'Accountability',   subtitle: 'Ownership \u00b7 Feedback \u00b7 Standards',    color: '#C9A84C' },
  execution:          { label: 'Execution',        subtitle: 'Habits \u00b7 Systems \u00b7 Delivery',         color: '#0ABFA3' },
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function readTime(body: string | null): string {
  if (!body) return '1 min'
  const words = body.split(/\s+/).length
  return `${Math.max(1, Math.round(words / 200))} min`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function pillarColor(pillar: string | null): string {
  return PILLAR_META[pillar ?? '']?.color ?? '#7a8a96'
}

function pillarLabel(pillar: string | null): string {
  return PILLAR_META[pillar ?? '']?.label ?? ''
}

// ── Story cards ─────────────────────────────────────────────────────────────

function LargeCard({ story }: { story: MediaStory }) {
  return (
    <Link href={`/media/${story.pillar}/${story.slug}`} className="block group" style={{ textDecoration: 'none' }}>
      <div className="bg-white rounded-lg overflow-hidden" style={{ border: '1px solid rgba(10,15,24,0.06)' }}>
        {story.featured_image_url && (
          <div className="overflow-hidden" style={{ height: 140 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.featured_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}
        <div className="p-4">
          <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[9px] mb-1.5" style={{ color: pillarColor(story.pillar) }}>
            {pillarLabel(story.pillar)}
          </p>
          <h3 className="font-body font-semibold text-[15px] leading-snug mb-2 group-hover:text-[#C9302A] transition-colors" style={{ color: '#0A0F18' }}>
            {story.title}
          </h3>
          {story.excerpt && (
            <p className="font-body text-[12px] leading-relaxed mb-2" style={{ color: 'rgba(10,15,24,0.5)' }}>
              {story.excerpt}
            </p>
          )}
          <p className="font-condensed text-[10px]" style={{ color: 'rgba(10,15,24,0.35)' }}>
            {readTime(story.body)} read
          </p>
        </div>
      </div>
    </Link>
  )
}

function SmallCard({ story }: { story: MediaStory }) {
  return (
    <Link href={`/media/${story.pillar}/${story.slug}`} className="block group" style={{ textDecoration: 'none' }}>
      <div className="bg-white rounded-lg overflow-hidden flex" style={{ border: '1px solid rgba(10,15,24,0.06)' }}>
        {story.featured_image_url && (
          <div className="flex-shrink-0 overflow-hidden" style={{ width: 100, height: 80 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.featured_image_url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-3 flex-1 min-w-0">
          <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[8px] mb-1" style={{ color: pillarColor(story.pillar) }}>
            {pillarLabel(story.pillar)}
          </p>
          <h4 className="font-body font-semibold text-[13px] leading-snug truncate group-hover:text-[#C9302A] transition-colors" style={{ color: '#0A0F18' }}>
            {story.title}
          </h4>
          <p className="font-condensed text-[9px] mt-1" style={{ color: 'rgba(10,15,24,0.35)' }}>
            {readTime(story.body)} read
          </p>
        </div>
      </div>
    </Link>
  )
}

// ── Sidebar row ─────────────────────────────────────────────────────────────

function SidebarRow({ story }: { story: MediaStory }) {
  return (
    <Link href={`/media/${story.pillar}/${story.slug}`} className="flex gap-3 py-2.5 group" style={{ textDecoration: 'none', borderBottom: '1px solid rgba(10,15,24,0.06)' }}>
      {story.featured_image_url && (
        <div className="flex-shrink-0 rounded overflow-hidden" style={{ width: 56, height: 44 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={story.featured_image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[8px] mb-0.5" style={{ color: pillarColor(story.pillar) }}>
          {pillarLabel(story.pillar)}
        </p>
        <h4 className="font-body font-semibold text-[12px] leading-snug truncate group-hover:text-[#C9302A] transition-colors" style={{ color: '#0A0F18' }}>
          {story.title}
        </h4>
      </div>
    </Link>
  )
}

// ── Main portal ─────────────────────────────────────────────────────────────

export function MediaPortalClient({
  featured,
  latest,
  sections,
}: {
  featured: MediaStory | null
  latest: MediaStory[]
  sections: PillarSection[]
}) {
  const [activePillar, setActivePillar] = useState('all')

  const filteredSections = activePillar === 'all'
    ? sections
    : sections.filter(s => s.key === activePillar)

  return (
    <div style={{ backgroundColor: '#F7F4EF', minHeight: '100vh' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-3"
        style={{ backgroundColor: '#fff', borderBottom: '1px solid rgba(10,15,24,0.08)' }}
      >
        <Link href="/media" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <span className="font-condensed font-bold tracking-[0.18em] text-[13px]" style={{ color: '#0A0F18' }}>
            EVOLVED<span style={{ color: '#C9302A' }}>{'\u00b7'}</span>PROS
          </span>
          <span className="font-condensed text-[10px] tracking-[0.1em] uppercase" style={{ color: 'rgba(10,15,24,0.35)' }}>
            Evolved Media
          </span>
        </Link>

        {/* Pill nav — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {PILLAR_PILLS.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => setActivePillar(p.key)}
              className="font-condensed font-semibold uppercase tracking-[0.08em] text-[10px] px-3 py-1.5 rounded-full transition-all"
              style={{
                backgroundColor: activePillar === p.key ? '#0A0F18' : 'transparent',
                color: activePillar === p.key ? '#F7F4EF' : 'rgba(10,15,24,0.45)',
              }}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <Link
          href="/login?mode=signup"
          className="font-condensed font-bold uppercase tracking-[0.08em] text-[10px] px-3.5 py-1.5 rounded-full transition-opacity hover:opacity-80"
          style={{ backgroundColor: '#0A0F18', color: '#F7F4EF' }}
        >
          Join free
        </Link>
      </header>

      {/* Mobile pill nav */}
      <div className="md:hidden overflow-x-auto px-4 py-2" style={{ borderBottom: '1px solid rgba(10,15,24,0.06)' }}>
        <div className="flex gap-1">
          {PILLAR_PILLS.map(p => (
            <button
              key={p.key}
              type="button"
              onClick={() => setActivePillar(p.key)}
              className="font-condensed font-semibold uppercase tracking-[0.08em] text-[10px] px-3 py-1.5 rounded-full whitespace-nowrap transition-all"
              style={{
                backgroundColor: activePillar === p.key ? '#0A0F18' : 'transparent',
                color: activePillar === p.key ? '#F7F4EF' : 'rgba(10,15,24,0.45)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Featured hero */}
        {featured && activePillar === 'all' && (
          <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 mb-10">
            {/* Left — featured story */}
            <Link href={`/media/${featured.pillar}/${featured.slug}`} className="block group" style={{ textDecoration: 'none' }}>
              <div className="relative rounded-lg overflow-hidden mb-4" style={{ height: 200 }}>
                {featured.featured_image_url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={featured.featured_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute top-3 left-3">
                      <span className="font-condensed font-bold uppercase tracking-[0.1em] text-[8px] px-2 py-1 rounded" style={{ backgroundColor: 'rgba(10,15,24,0.7)', color: '#F7F4EF' }}>
                        Evolved Media {'\u00b7'} Pioneer Driver
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#E8E3DB' }}>
                    <span className="font-condensed text-[11px]" style={{ color: 'rgba(10,15,24,0.2)' }}>No image</span>
                  </div>
                )}
              </div>
              <p className="font-condensed font-bold uppercase tracking-[0.12em] text-[9px] mb-1.5" style={{ color: pillarColor(featured.pillar) }}>
                {pillarLabel(featured.pillar)}
              </p>
              <h2 className="font-body font-bold text-[18px] leading-snug mb-2 group-hover:text-[#C9302A] transition-colors" style={{ color: '#0A0F18', fontFamily: 'Georgia, serif' }}>
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p className="font-body text-[13px] leading-relaxed mb-3" style={{ color: 'rgba(10,15,24,0.55)' }}>
                  {featured.excerpt}
                </p>
              )}
              <p className="font-condensed text-[10px]" style={{ color: 'rgba(10,15,24,0.35)' }}>
                {featured.author ?? 'George Leith'} {'\u00b7'} {formatDate(featured.published_at)} {'\u00b7'} {readTime(featured.body)} read
              </p>
            </Link>

            {/* Right — latest stories sidebar */}
            <div>
              <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[9px] mb-3" style={{ color: 'rgba(10,15,24,0.35)' }}>
                Latest Stories
              </p>
              <div className="flex flex-col">
                {latest.map(s => <SidebarRow key={s.id} story={s} />)}
                {latest.length === 0 && (
                  <p className="font-condensed text-[12px]" style={{ color: 'rgba(10,15,24,0.3)' }}>No stories yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pillar sections */}
        {filteredSections.map((section, idx) => (
          <div key={section.key}>
            {/* Upsell banner after second section */}
            {idx === 2 && activePillar === 'all' && (
              <div
                className="rounded-xl px-8 py-10 mb-8 text-center"
                style={{ backgroundColor: '#0A0F18' }}
              >
                <p className="font-condensed font-bold uppercase tracking-[0.2em] text-[10px] mb-2" style={{ color: '#C9A84C' }}>
                  Go deeper on every story
                </p>
                <h3 className="font-body font-bold text-[20px] mb-2" style={{ color: '#F7F4EF', fontFamily: 'Georgia, serif' }}>
                  The Academy puts the system behind the headlines.
                </h3>
                <p className="font-body text-[13px] mb-5 max-w-md mx-auto" style={{ color: 'rgba(245,240,232,0.5)' }}>
                  VIP gets Pillars 1{'\u2013'}3. Professional gets the full 6-pillar EVOLVED system.
                </p>
                <Link
                  href="/pricing"
                  className="inline-block font-condensed font-bold uppercase tracking-[0.1em] text-[12px] px-6 py-3 rounded transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#C9302A', color: '#fff' }}
                >
                  Join from $49/month
                </Link>
              </div>
            )}

            <div className="mb-8">
              {/* Section header */}
              <div
                className="flex items-center justify-between mb-4 pl-4"
                style={{ borderLeft: `4px solid ${section.color}` }}
              >
                <div>
                  <h2 className="font-body font-semibold text-[13px]" style={{ color: '#0A0F18' }}>
                    {section.label}
                  </h2>
                  <p className="font-condensed text-[10px]" style={{ color: 'rgba(10,15,24,0.4)' }}>
                    {section.subtitle}
                  </p>
                </div>
                <span className="font-condensed font-semibold text-[10px] tracking-wide" style={{ color: section.color }}>
                  More in {section.label} {'\u2192'}
                </span>
              </div>

              {/* Story grid: 1 large + 2 small */}
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
                {section.stories[0] && <LargeCard story={section.stories[0]} />}
                <div className="flex flex-col gap-4">
                  {section.stories.slice(1, 3).map(s => <SmallCard key={s.id} story={s} />)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredSections.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-condensed text-[13px]" style={{ color: 'rgba(10,15,24,0.35)' }}>
              No published stories in this category yet.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-6 py-6 text-center" style={{ borderTop: '1px solid rgba(10,15,24,0.06)' }}>
        <p className="font-condensed text-[10px] tracking-wide" style={{ color: 'rgba(10,15,24,0.3)' }}>
          Evolved Media {'\u00b7'} Evolved Pros Platform
        </p>
      </footer>
    </div>
  )
}
