import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcademyMobileProgress } from '@/components/academy/AcademyMobileProgress'

export const metadata: Metadata = { title: 'Academy — Evolved Pros' }
import { CourseGrid } from '@/components/academy/CourseGrid'
import { AcademyArchitectureCard } from '@/components/academy/AcademyArchitectureCard'
import {
  fetchCoursesWithProgress,
  fetchUserProfile,
} from '@/lib/academy/fetchers'
import { hasTierAccess } from '@/lib/tier'
import { ACADEMY_UPGRADE_AD } from '@/lib/sponsors/partners'

export const dynamic = 'force-dynamic'

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
        <CourseGrid courses={courses} userTier={profile?.tier ?? null} />
        {showUpgrade && (
          <div className="mt-8 max-w-xl">
            <AcademyArchitectureCard ad={ACADEMY_UPGRADE_AD} href="/pricing" />
          </div>
        )}
      </div>
    </div>
  )
}
