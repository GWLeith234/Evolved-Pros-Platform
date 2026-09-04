import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcademyMobileProgress } from '@/components/academy/AcademyMobileProgress'

export const metadata: Metadata = { title: 'Academy — Evolved Pros' }
import { CourseCard } from '@/components/academy/CourseCard'
import { AcademyArchitectureCard } from '@/components/academy/AcademyArchitectureCard'
import { IabAdvertisementSlot } from '@/components/ads/IabImageAd'
import {
  fetchCoursesWithProgress,
  fetchUserProfile,
} from '@/lib/academy/fetchers'
import { hasTierAccess } from '@/lib/tier'
import { ACADEMY_UPGRADE_AD, pickAcademySponsors, pickScrollBanners } from '@/lib/sponsors/partners'
import { getActivePlatformAds } from '@/lib/cache/shared'
import { adMatchesSurface, isIabImageStill } from '@/lib/ads/iab'
import { ACADEMY_CARDS_PER_AD, interleaveAds } from '@/lib/ads/rhythm'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

export const dynamic = 'force-dynamic'

type AcademyUnit =
  | { id: string; kind: 'upgrade' }
  | { id: string; kind: 'iab'; ad: SponsorAd }

function AcademyAdBreak({ unit }: { unit: AcademyUnit }) {
  if (unit.kind === 'upgrade') {
    return (
      <div data-ad-rhythm="unit" className="flex justify-center py-2">
        <div className="w-full max-w-xl">
          <AcademyArchitectureCard ad={ACADEMY_UPGRADE_AD} locationId="academy-upgrade" />
        </div>
      </div>
    )
  }
  if (!unit.ad.image_url) return null
  return (
    <div data-ad-rhythm="unit" className="flex justify-center py-2">
      <IabAdvertisementSlot
        ad={{ ...unit.ad, image_url: unit.ad.image_url }}
        locationId="academy"
      />
    </div>
  )
}

export default async function AcademyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)

  // lesson_progress rows are keyed on public.users.id (profile.id, resolved
  // by email above), NOT the auth session uid — passing user.id here zeroed
  // every pillar % for accounts where the two UUIDs diverge.
  const courses = await fetchCoursesWithProgress(supabase, profile?.id ?? user.id, profile?.tier as 'community' | 'vip' | 'pro' | null | undefined)

  const totalLessons = courses.reduce((s, c) => s + (c.totalLessons ?? 0), 0)
  const completedLessons = courses.reduce((s, c) => s + c.completedLessons, 0)
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
  const showUpgrade = !hasTierAccess(profile?.tier, 'pro')
  const catalog = (await getActivePlatformAds()) as SponsorAd[]
  const academyPool = catalog.filter(a => adMatchesSurface(a, 'academy'))
  const pool = academyPool.length ? academyPool : catalog
  const sponsorAds = pickAcademySponsors(pool, 6)
  const scrollBanners = pickScrollBanners(pool, 4)

  const units: AcademyUnit[] = []
  if (showUpgrade) units.push({ id: 'academy-upgrade', kind: 'upgrade' })
  for (const banner of scrollBanners) {
    if (!isIabImageStill(banner) || units.some(u => u.id === banner.id)) continue
    units.push({ id: banner.id, kind: 'iab', ad: banner })
  }
  for (const ad of sponsorAds) {
    if (units.some(u => u.id === ad.id)) continue
    units.push({ id: ad.id, kind: 'iab', ad })
  }

  // A row of pillar cards, then one unit — every three cards, trailing on a short catalog.
  const chunks = interleaveAds(courses, units, ACADEMY_CARDS_PER_AD, { trailing: true })

  return (
    <div className="academy-page ep-surface-mobile">
      <div className="academy-page-header px-4 md:px-8 py-5 sm:py-6">
        <p
          className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1"
          style={{ color: 'var(--brand-teal, #0ABFA3)' }}
        >
          The Evolved Architecture™
        </p>
        <h1 className="font-display font-black leading-tight ep-fluid-title">
          The Academy
        </h1>
        <p className="academy-lede font-body text-[14px] mt-1">
          A 6-pillar professional development framework designed to transform how you work, think, and lead.
        </p>
        {/* SPRINT TIER-1: the assessment is a community-tier feature — every
            member, free included, sees their real six scores. Linked from the
            header so it is reachable regardless of which pillars are open. */}
        <Link
          href="/academy/assessment"
          className="inline-flex items-center gap-2 mt-3 font-condensed font-bold uppercase tracking-[0.14em] text-[11px] ep-touch-target"
          style={{
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            padding: '8px 16px',
            minHeight: 40,
            textDecoration: 'none',
          }}
        >
          Your Pillar Assessment →
        </Link>
      </div>

      {/* Mobile collapsible progress — hidden on desktop */}
      <AcademyMobileProgress
        courses={courses}
        userTier={profile?.tier ?? null}
        overallPct={overallPct}
      />

      <div className="px-4 md:px-8 py-5 sm:py-6">
        <div className="flex flex-col gap-6">
          {chunks.map((chunk, idx) =>
            chunk.kind === 'ad' ? (
              <AcademyAdBreak key={`${chunk.ad.id}-${idx}`} unit={chunk.ad} />
            ) : (
              <div
                key={chunk.items.map(c => c.id).join('-') || `row-${idx}`}
                className="academy-course-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              >
                {chunk.items.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isLocked={!course.hasAccess}
                    userTier={profile?.tier ?? null}
                  />
                ))}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  )
}
