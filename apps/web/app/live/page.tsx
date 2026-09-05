// SPRINT N — THEME DECISION: /live is a standalone navy-only studio/marketing
// shell (constant dark editorial palette, its own --text-*/--border-* tokens in
// globals.css). It is intentionally NOT wired to the app light/dark toggle and
// is out of scope for the member/admin light-dark work by design.
import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { LiveMasthead } from '@/components/live/LiveMasthead'
import { LiveSplitHero } from '@/components/live/LiveSplitHero'
import { LiveSectionHeader } from '@/components/live/LiveSectionHeader'
import { LiveGlobeLazy } from './LiveGlobeLazy'
import { LiveUpcomingDates } from '@/components/live/LiveUpcomingDates'
import { LivePastSpeaking } from '@/components/live/LivePastSpeaking'
import { LiveProductMilestones } from '@/components/live/LiveProductMilestones'
import { LiveSponsors } from '@/components/live/LiveSponsors'
import { LivePillarGrid } from '@/components/live/LivePillarGrid'
import { LiveTestimonials } from '@/components/live/LiveTestimonials'
import { LivePhotoRotator } from '@/components/live/LivePhotoRotator'
import { LiveFinalCTA } from '@/components/live/LiveFinalCTA'
import { LiveBookingInquiry } from '@/components/live/LiveBookingInquiry'
import { SPEAKING_STATS } from '@/lib/live/speaking-pins'
import { getSpeakingPins, statsFromPins } from '@/lib/live/get-speaking-pins'
import { pickLivePageAds } from '@/lib/sponsors/partners'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'
import { SPONSOR_AD_COLUMNS } from '@/components/home/HomeSponsorAd'
import { adMatchesSurface, filterLiveAds, isLeaderboardStill } from '@/lib/ads/iab'
import { publicPageMetadata } from '@/lib/seo/canonical'
import { PublicFooter } from '@/components/layout/PublicFooter'

export const metadata: Metadata = publicPageMetadata('/live', {
  title: 'LIVE | Evolved Pros',
  description:
    'High-energy keynotes, workshops, and mastermind formats. Upcoming and past speaking events worldwide — powered by the EVOLVED Architecture™.',
})

async function fetchLiveSponsors(): Promise<SponsorAd[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (adminClient as any)
      .from('platform_ads')
      .select(SPONSOR_AD_COLUMNS + ', placement')
      .eq('is_active', true)
      .order('sort_order')
      .limit(48)
    const all = filterLiveAds((rows ?? []) as SponsorAd[]).filter(a => adMatchesSurface(a, 'live'))
    if (all.length === 0) return []
    return pickLivePageAds(all.filter(a => !isLeaderboardStill(a)))
  } catch {
    return []
  }
}

export default async function LivePage() {
  const pins = await getSpeakingPins()
  const pinStats = statsFromPins(pins)
  const tourTitle = `${SPEAKING_STATS.talks}+ stages. ${pinStats.countries} countries. ${SPEAKING_STATS.yearsActive} years.`

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const sponsors = await fetchLiveSponsors()

  return (
    <div
      className="live-force-dark live-page-shell"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-page)',
        color: 'var(--text-strong)',
        /* Bottom inset lives on .live-page-shell so the mobile inquire bar
           can raise it without an inline style fight. */
      }}
    >
      {user && (
        <Link
          href="/home"
          aria-label="Back to platform"
          className="ep-pressable ep-touch-target absolute z-50 text-sm text-white/70 hover:text-white transition bg-black/40 rounded backdrop-blur-sm"
          style={{
            top: 'max(16px, env(safe-area-inset-top, 0px))',
            right: 'max(16px, env(safe-area-inset-right, 0px))',
            minHeight: 44,
            padding: '10px 14px',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          ← Platform
        </Link>
      )}

      {/* Title: LIVE (via LiveMasthead) */}
      <LiveMasthead />
      <LiveSplitHero />

      {/* Upcoming speaking — clear slot for confirmed dates / holds */}
      <LiveUpcomingDates />

      <LiveSponsors ads={sponsors.slice(0, 1)} />

      {/* Past stages — globe (cities as pins) + city archive */}
      <section className="live-section-pad" style={{ marginTop: 56 }}>
        <LiveSectionHeader
          eyebrow="The Tour"
          title={tourTitle}
          kicker="Every gold pin is a city where George has taken the stage."
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
          <LiveGlobeLazy pins={pins} />
        </div>
        <p style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
          Countries on tour: {Array.from(new Set(pins.map(p => p.country))).join(', ')}.
        </p>
      </section>

      <LivePastSpeaking pins={pins} />

      <LiveSponsors ads={sponsors.slice(1, 2)} />

      {/* Product / platform milestones — not speaking */}
      <LiveProductMilestones />

      <LiveSponsors ads={sponsors.slice(2, 3)} />

      <LivePillarGrid />

      <LiveSponsors ads={sponsors.slice(3, 4)} />

      <LiveTestimonials />

      <LiveSponsors ads={sponsors.slice(4, 5)} />

      <LivePhotoRotator />

      <LiveSponsors ads={sponsors.slice(5, 6)} />
      <LiveFinalCTA />
      <LiveBookingInquiry />

      {/* SPRINT FOOTER-1 — /live sits outside the (public) route group, so it
         mounts the global footer itself. It goes INSIDE .live-force-dark: that
         wrapper re-declares the semantic tokens to their dark values in light
         mode, so the footer stays navy with the rest of the page instead of
         flipping to parchment underneath it. */}
      <PublicFooter />
    </div>
  )
}
