'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────────────────────

interface Episode {
  id: string
  episode_number: number
  title: string
  slug: string
  duration_seconds: number | null
  published_at: string | null
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(s: number | null): string {
  if (!s) return ''
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Constants ────────────────────────────────────────────────────────────────

const PILLARS = [
  { label: 'Foundation', color: '#FFA538', slug: 'foundation' },
  { label: 'Identity', color: '#A78BFA', slug: 'identity' },
  { label: 'Mental Toughness', color: '#F87171', slug: 'mental-toughness' },
  { label: 'Strategy', color: '#60A5FA', slug: 'strategy' },
  { label: 'Accountability', color: '#C9A84C', slug: 'accountability' },
  { label: 'Execution', color: '#0ABFA3', slug: 'execution' },
]

const PLATFORM_LINKS = [
  { label: '← Back to platform', href: '/home' },
  { label: 'Community', href: '/community' },
  { label: 'Academy', href: '/academy' },
  { label: 'Events', href: '/events' },
]

const NETWORK_LINKS = [
  { label: 'www.evolvedpros.com', href: 'https://evolvedpros.com' },
  { label: 'www.georgeleith.com', href: 'https://georgeleith.com' },
  { label: 'www.evolvex360.com', href: 'https://evolvex360.com' },
  { label: 'www.adcellerant.com', href: 'https://adcellerant.com' },
  { label: 'www.vendasta.com', href: 'https://vendasta.com' },
]

const ABOUT_LINKS = [
  { label: 'About George Leith', href: '/live' },
  { label: 'The EVOLVED Framework', href: '/academy' },
  { label: 'Advertise with us', href: 'mailto:support@evolvedpros.com?subject=Advertising%20inquiry' },
]

const FC = 'var(--font-condensed)'
const FB = 'var(--font-body)'

// ── Styles ───────────────────────────────────────────────────────────────────

const FL = 'var(--font-logo)'
const FA = 'var(--font-abril)'

const hdr: React.CSSProperties = {
  fontFamily: FL, fontWeight: 400, fontSize: 12, textTransform: 'uppercase',
  letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', paddingBottom: 6,
  borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 8,
}

const fLink: React.CSSProperties = {
  fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: FB,
  textDecoration: 'none', display: 'block', padding: '3px 0',
}

// ── Component ────────────────────────────────────────────────────────────────

export function MediaFooter() {
  const [episodes, setEpisodes] = useState<Episode[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('episodes')
      .select('id, episode_number, title, slug, duration_seconds, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3)
      .then(({ data }: { data: Episode[] | null }) => { if (data) setEpisodes(data) })
      .catch(() => {})
  }, [])

  return (
    <>
      {/* ── Pre-footer CTA band ── */}
      <div style={{ backgroundColor: '#2B3A5A', padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontFamily: FC, fontWeight: 700, fontSize: 11, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>
            Join the community
          </p>
          <h2 style={{ fontFamily: FA, fontWeight: 400, fontSize: 28, color: '#fff', textTransform: 'uppercase', lineHeight: 1.1, margin: 0 }}>
            Ready to evolve<br />your career?
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 5, fontFamily: FB }}>
            10,000 high-performing sales professionals. One platform.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/live" style={{ fontFamily: FC, fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.65)', border: '1.5px solid rgba(255,255,255,0.2)', padding: '8px 18px', borderRadius: 3, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Learn more
          </Link>
          <Link href="/pricing" style={{ fontFamily: FC, fontWeight: 700, fontSize: 12, color: '#fff', backgroundColor: '#C9302A', padding: '8px 18px', borderRadius: 3, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em', border: '1.5px solid #C9302A' }}>
            Join Evolved Pros →
          </Link>
        </div>
      </div>

      {/* ── Main footer ── */}
      <footer style={{ backgroundColor: '#1a2640', padding: '32px 40px 0' }}>
        <div
          className="media-footer-grid"
          style={{ display: 'grid', gridTemplateColumns: '210px 1fr 1fr 1fr', gap: 28 }}
        >
          {/* COL 1 — Brand */}
          <div>
            <p style={{ fontFamily: FA, fontWeight: 400, fontSize: 28, color: '#fff', textTransform: 'uppercase', lineHeight: 1, margin: '0 0 8px' }}>
              EVOLVED <span style={{ color: '#C9302A' }}>M</span>EDIA
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', lineHeight: 1.65, fontFamily: FB, margin: '0 0 14px' }}>
              Original content for the evolved professional. Strategy, mindset, and execution&mdash;
            </p>

            {/* Social row */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 14 }}>
              <a href="https://linkedin.com/company/evolved-pros" target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, borderRadius: 2, backgroundColor: '#0077B5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: FC, textDecoration: 'none' }}>in</a>
              <a href="https://twitter.com/evolvedpros" target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: FC, textDecoration: 'none' }}>X</a>
              <a href="https://youtube.com/@evolvedpros" target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, borderRadius: 2, backgroundColor: '#C9302A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, textDecoration: 'none' }}>▶</a>
              <a href="https://open.spotify.com" target="_blank" rel="noopener noreferrer" style={{ width: 28, height: 28, borderRadius: 2, backgroundColor: '#1DB954', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, textDecoration: 'none' }}>♪</a>
            </div>

            {/* Badge links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Link href="/live" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                <span style={{ width: 20, height: 20, borderRadius: 3, backgroundColor: '#C9302A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <span className="live-dot" />
                </span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: FC, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Evolved Pros Live</span>
              </Link>
              <a href="mailto:support@evolvedpros.com?subject=Sponsorship%20inquiry" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                <span style={{ width: 20, height: 20, borderRadius: 3, backgroundColor: '#C9A84C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>$</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: FC, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sponsor</span>
              </a>
              <a href="https://evolvedpros.com/merch" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                <span style={{ width: 20, height: 20, borderRadius: 3, backgroundColor: '#2B3A5A', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>★</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontFamily: FC, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Merch</span>
              </a>
            </div>
          </div>

          {/* COL 2 — By Pillar + Platform */}
          <div>
            <p style={hdr}>By Pillar</p>
            {PILLARS.map(p => (
              <Link key={p.slug} href={`/media?pillar=${p.slug}`} style={{ ...fLink, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: p.color, flexShrink: 0 }} />
                {p.label}
              </Link>
            ))}
            <p style={{ ...hdr, marginTop: 14 }}>Platform</p>
            {PLATFORM_LINKS.map(l => (
              <Link key={l.href} href={l.href} style={fLink}>{l.label}</Link>
            ))}
          </div>

          {/* COL 3 — Latest Podcast */}
          <div>
            <p style={hdr}>Latest Podcast</p>
            {episodes.length > 0 ? episodes.map(ep => (
              <div key={ep.id} style={{ paddingBottom: 8, marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 9, fontWeight: 700, fontFamily: FC, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>
                  Episode {ep.episode_number}
                </p>
                <Link href={`/podcast/${ep.slug ?? ''}`} style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: FB, textDecoration: 'none', lineHeight: 1.4, display: 'block', marginBottom: 2 }}>
                  {ep.title}
                </Link>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontFamily: FB, margin: 0 }}>
                  {formatDuration(ep.duration_seconds)}{ep.published_at ? ` · ${formatDate(ep.published_at)}` : ''}
                </p>
              </div>
            )) : (
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: FB }}>Episodes coming soon</p>
            )}
            <Link href="/podcast" style={{ fontSize: 11, color: '#C9A84C', fontFamily: FC, fontWeight: 700, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              All episodes →
            </Link>
          </div>

          {/* COL 4 — Network + About */}
          <div>
            <p style={hdr}>Network</p>
            {NETWORK_LINKS.map(l => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" style={{ ...fLink, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {l.label}
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>↗</span>
              </a>
            ))}
            <p style={{ ...hdr, marginTop: 14 }}>About</p>
            {ABOUT_LINKS.map(l => (
              <Link key={l.label} href={l.href} style={fLink}>{l.label}</Link>
            ))}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 24, padding: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span style={{ fontFamily: FL, fontWeight: 400, fontSize: 16, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              EV<span style={{ color: '#C9302A' }}>O</span>LVED PR<span style={{ color: '#C9302A' }}>O</span>S
            </span>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontFamily: FB, margin: '2px 0 0' }}>
              © 2026 Evolved Pros. All rights reserved.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {['Privacy', 'Terms', 'Cookies'].map(label => (
              <Link key={label} href={`/${label.toLowerCase()}`} style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: FB, textDecoration: 'none' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      {/* Live dot animation + responsive */}
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
        .live-dot { width:5px; height:5px; border-radius:50%; background:#fff; animation: pulse 1.5s infinite; }
        @media (max-width: 767px) {
          .media-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
