import { CourseCard } from './CourseCard'
import type { CourseWithProgress } from '@/lib/academy/types'

interface LeaderboardAd {
  id: string
  image_url: string | null
  click_url: string | null
  link_url: string | null
  headline: string | null
  sponsor_name: string | null
}

interface CourseGridProps {
  courses: CourseWithProgress[]
  userTier: string | null
  leaderboardAd?: LeaderboardAd | null
}

export function CourseGrid({ courses, userTier, leaderboardAd }: CourseGridProps) {
  // Split courses into two rows of 3 (for 6-pillar layout)
  const row1 = courses.slice(0, 3)
  const row2 = courses.slice(3)

  return (
    <div className="space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-3 gap-4">
        {row1.map(course => (
          <CourseCard key={course.id} course={course} isLocked={!course.hasAccess} />
        ))}
      </div>

      {/* Zone C — 728×90 leaderboard between rows */}
      {leaderboardAd && (
        <a
          href={leaderboardAd.click_url || leaderboardAd.link_url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg overflow-hidden transition-opacity hover:opacity-90"
          style={{ border: '1px solid rgba(27,60,90,0.08)' }}
        >
          {leaderboardAd.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={leaderboardAd.image_url}
              alt={leaderboardAd.sponsor_name ?? leaderboardAd.headline ?? 'Advertisement'}
              className="w-full"
              style={{ height: '90px', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div
              className="w-full flex items-center justify-between px-6"
              style={{ height: '90px', backgroundColor: 'rgba(27,60,90,0.04)' }}
            >
              <span className="font-body font-semibold text-[14px]" style={{ color: '#1b3c5a' }}>
                {leaderboardAd.headline ?? leaderboardAd.sponsor_name ?? 'Sponsored'}
              </span>
              <span
                className="font-condensed font-bold text-[8px] uppercase tracking-wider rounded px-2 py-1 flex-shrink-0"
                style={{ backgroundColor: '#ef0e30', color: 'white' }}
              >
                AD
              </span>
            </div>
          )}
        </a>
      )}

      {/* Row 2 */}
      {row2.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {row2.map(course => (
            <CourseCard key={course.id} course={course} isLocked={!course.hasAccess} />
          ))}
        </div>
      )}
    </div>
  )
}
