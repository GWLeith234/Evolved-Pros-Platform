import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { LiveMasthead } from '@/components/live/LiveMasthead'
import { LiveSplitHero } from '@/components/live/LiveSplitHero'
import { LiveSectionHeader } from '@/components/live/LiveSectionHeader'
import { LiveGlobe } from '@/components/live/LiveGlobe'
import { LiveUpcomingDates } from '@/components/live/LiveUpcomingDates'
import { LivePastSpeaking } from '@/components/live/LivePastSpeaking'
import { LiveSponsors } from '@/components/live/LiveSponsors'
import { LivePillarGrid } from '@/components/live/LivePillarGrid'
import { LiveTestimonials } from '@/components/live/LiveTestimonials'
import { LivePhotoRotator } from '@/components/live/LivePhotoRotator'
import { LiveFinalCTA } from '@/components/live/LiveFinalCTA'
import { SPEAKING_PINS, SPEAKING_STATS } from '@/lib/live/speaking-pins'
import {
  DEFAULT_ACADEMY_SPONSORS,
  pickAcademySponsors,
} from '@/lib/sponsors/partners'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { SPONSOR_AD_COLUMNS } from '@/components/home/HomeSponsorAd'

export const metadata: Metadata = {
  title: 'LIVE — Evolved Pros',
  description:
    'High-energy keynotes, workshops, and mastermind formats. Upcoming and past speaking events worldwide — powered by the EVOLVED Architecture™.',
}

async function fetchLiveSponsors(): Promise<SponsorAd[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (adminClient as any)
      .from('platform_ads')
      .select(SPONSOR_AD_COLUMNS + ', placement')
      .eq('is_active', true)
      .order('sort_order')
      .limit(12)
    const all = (rows ?? []) as SponsorAd[]
    if (all.length === 0) return DEFAULT_ACADEMY_SPONSORS
    return pickAcademySponsors(all, 2)
  } catch {
    return DEFAULT_ACADEMY_SPONSORS
  }
}

export default async function LivePage() {
  const countries = SPEAKING_STATS.countries
  const tourTitle = `${SPEAKING_STATS.talks}+ stages. ${countries} countries. ${SPEAKING_STATS.yearsActive} years.`

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const sponsors = await fetchLiveSponsors()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-strong)' }}>
      {user && (
        <Link
          href="/home"
          aria-label="Back to platform"
          className="absolute top-4 right-4 z-50 text-sm text-white/70 hover:text-white transition bg-black/40 px-3 py-2 rounded backdrop-blur-sm"
        >
          ← Platform
        </Link>
      )}

      {/* Title: LIVE (via LiveMasthead) */}
      <LiveMasthead />
      <LiveSplitHero />

      {/* Globe — tour overview */}
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
        <p style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
          Countries on tour: {Array.from(new Set(SPEAKING_PINS.map(p => p.country))).join(', ')}.
        </p>
      </section>

      {/* Upcoming speaking events — cities on every row */}
      <LiveUpcomingDates />

      {/* Past speaking events — cities by country */}
      <LivePastSpeaking />

      {/* Evolution Partner ads */}
      <LiveSponsors ads={sponsors} />

      <LivePillarGrid />
      <LiveTestimonials />
      <LivePhotoRotator />
      <LiveFinalCTA />
    </div>
  )
}
