import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcademySidebar } from '@/components/academy/AcademySidebar'
import { CourseGrid } from '@/components/academy/CourseGrid'
import { UpgradePrompt } from '@/components/academy/UpgradePrompt'
import {
  fetchCoursesWithProgress,
  fetchUserProfile,
} from '@/lib/academy/fetchers'

export const dynamic = 'force-dynamic'

export default async function AcademyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await fetchUserProfile(supabase, user.id)
  const courses = await fetchCoursesWithProgress(supabase, user.id, profile?.tier)

  const totalLessons = courses.reduce((s, c) => s + c.totalLessons, 0)
  const completedLessons = courses.reduce((s, c) => s + c.completedLessons, 0)
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <div className="flex" style={{ minHeight: '100%' }}>
      <AcademySidebar
        courses={courses}
        userTier={profile?.tier ?? null}
        overallPct={overallPct}
      />
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#faf9f7' }}>
        {/* Page header */}
        <div
          className="px-8 py-6"
          style={{ borderBottom: '1px solid rgba(27,60,90,0.08)', backgroundColor: 'white' }}
        >
          <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[10px] mb-1" style={{ color: '#68a2b9' }}>
            The Evolved Architecture™
          </p>
          <h1
            className="font-display font-black leading-tight"
            style={{ fontSize: '32px', color: '#112535' }}
          >
            The Academy
          </h1>
          <p className="font-body text-[14px] mt-1" style={{ color: '#7a8a96' }}>
            6 Pillar Course Tracks — Your complete professional transformation framework.
          </p>
        </div>

        <div className="px-8 py-6">
          <CourseGrid courses={courses} userTier={profile?.tier ?? null} />
          {profile?.tier !== 'pro' && <UpgradePrompt />}
        </div>
      </main>
    </div>
  )
}
