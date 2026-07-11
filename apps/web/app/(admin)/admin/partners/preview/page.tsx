import type { Metadata } from 'next'
import { SponsorCardHero } from '@/components/sponsors/SponsorCardHero'
import { SponsorCardRail } from '@/components/sponsors/SponsorCardRail'
import { SponsorCardInline } from '@/components/sponsors/SponsorCardInline'
import { SponsorCardPreroll } from '@/components/sponsors/SponsorCardPreroll'
import { SponsorCardLessonBreak } from '@/components/sponsors/SponsorCardLessonBreak'
import type { Sponsor } from '@/components/sponsors/types'

export const metadata: Metadata = { title: 'Partners — Card preview' }

// Opt out of static generation: this admin-only card gallery renders client
// sponsor components and has no need to be prerendered — forcing dynamic
// rendering avoids the build-time static-generation timeout.
export const dynamic = 'force-dynamic'

const NOW = '2026-05-05T00:00:00.000Z'

const MOCK: Sponsor = {
  id: 'preview-mock-sponsor',
  name: 'Helio Coffee Co.',
  url: 'https://example.com/heliocoffee',
  logo_url: null,
  brand_color: '#FF6B35',
  type: 'sponsor',
  tagline: 'Sun-roasted beans for people who close before noon.',
  body_copy: 'Direct-trade single origins, shipped fresh on the day they roast. 20% off your first bag with code EVOLVED.',
  cta_text: 'Shop Helio',
  cta_url: 'https://example.com/heliocoffee?utm_source=evolved',
  status: 'active',
  contract_start: '2026-01-01',
  contract_end: '2026-12-31',
  impression_cap: 100000,
  commission_pct: 12.5,
  tracking_id: 'helio-2026',
  created_at: NOW,
  updated_at: NOW,
}

const SECTION: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const LABEL: React.CSSProperties = {
  fontFamily: '"Barlow Condensed", sans-serif',
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: '#7a8a96',
  margin: 0,
}

export default function PartnersPreviewPage() {
  return (
    <main style={{ padding: '32px 24px 96px', maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: 28 }}>
        <p style={LABEL}>Sponsors · Card variants</p>
        <h1
          style={{
            margin: '4px 0 6px',
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 900,
            fontSize: 32,
            letterSpacing: '-0.01em',
            color: '#1b3c5a',
          }}
        >
          Partner card preview
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: '#7a8a96' }}>
          Renders all five SponsorCard* variants with one mock sponsor. Brand color
          drives the top-border / left-border / CTA outline / logo border on each.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <section style={SECTION}>
          <p style={LABEL}>Hero · 2-up on home</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <SponsorCardHero sponsor={MOCK} />
            <SponsorCardHero sponsor={MOCK} />
          </div>
        </section>

        <section style={SECTION}>
          <p style={LABEL}>Rail · 230px</p>
          <SponsorCardRail sponsor={MOCK} />
        </section>

        <section style={SECTION}>
          <p style={LABEL}>Inline · 64px row</p>
          <SponsorCardInline sponsor={MOCK} />
        </section>

        <section style={SECTION}>
          <p style={LABEL}>Preroll · podcast top/bottom band</p>
          <SponsorCardPreroll sponsor={MOCK} />
        </section>

        <section style={SECTION}>
          <p style={LABEL}>Lesson break · academy</p>
          <SponsorCardLessonBreak sponsor={MOCK} />
        </section>
      </div>
    </main>
  )
}
