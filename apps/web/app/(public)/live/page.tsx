import type { Metadata } from 'next'
import { LiveMasthead } from '@/components/live/LiveMasthead'
import { LiveSplitHero } from '@/components/live/LiveSplitHero'
import { LiveSectionHeader } from '@/components/live/LiveSectionHeader'
import { LiveGlobe } from '@/components/live/LiveGlobe'
import { LiveUpcomingDates } from '@/components/live/LiveUpcomingDates'
import { LivePillarGrid } from '@/components/live/LivePillarGrid'
import { LiveTestimonials } from '@/components/live/LiveTestimonials'
import { LivePhotoRotator } from '@/components/live/LivePhotoRotator'
import { LiveFinalCTA } from '@/components/live/LiveFinalCTA'
import { SPEAKING_PINS, SPEAKING_STATS } from '@/lib/live/speaking-pins'

export const metadata: Metadata = {
  title: 'Evolved Pros LIVE — Keynotes & Workshops',
  description:
    'High-energy keynotes, workshops, and mastermind formats for sales conferences, SKOs, and revenue leadership summits. Powered by the EVOLVED Architecture™.',
}

export default function LivePage() {
  const countries = SPEAKING_STATS.countries
  const tourTitle = `${SPEAKING_STATS.talks}+ stages. ${countries} countries. ${SPEAKING_STATS.yearsActive} years.`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-strong)' }}>
      <LiveMasthead />
      <LiveSplitHero />

      {/* Globe section */}
      <section style={{ maxWidth: 1280, margin: '56px auto 0', padding: '0 24px' }}>
        <LiveSectionHeader
          eyebrow="The Tour"
          title={tourTitle}
          kicker="Every gold pin is a stage George has stood on."
        />
        <div
          style={{
            marginTop: 24,
            border: '1px solid var(--border-soft2)',
            borderTop: '3px solid #C9A84C',
            background: 'var(--bg-page)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <LiveGlobe />
        </div>
        {/* Static a11y fallback: country list for screen readers */}
        <p style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
          Countries on tour: {Array.from(new Set(SPEAKING_PINS.map(p => p.country))).join(', ')}.
        </p>
      </section>

      <LiveUpcomingDates />
      <LivePillarGrid />
      <LiveTestimonials />
      <LivePhotoRotator />
      <LiveFinalCTA />
    </div>
  )
}
