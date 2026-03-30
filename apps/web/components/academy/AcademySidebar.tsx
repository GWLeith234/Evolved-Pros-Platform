'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CourseWithProgress } from '@/lib/academy/types'
import { Tooltip } from '@/components/ui/Tooltip'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

interface AcademySidebarProps {
  courses: CourseWithProgress[]
  userTier: string | null
  overallPct: number
}

export function AcademySidebar({ courses, userTier, overallPct }: AcademySidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col pt-5 pb-4"
      style={{ backgroundColor: '#112535', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Section header */}
      <p
        className="px-5 mb-1 font-condensed font-bold uppercase tracking-[0.2em] text-[9px]"
        style={{ color: 'rgba(255,255,255,0.25)' }}
      >
        Pillars
      </p>

      {/* All Courses link */}
      <NavItem
        href="/academy"
        label="All Courses"
        active={pathname === '/academy'}
        locked={false}
        userTier={userTier}
      />

      {/* One per pillar */}
      {courses.map(course => {
        const locked = !course.hasAccess
        const active = pathname.startsWith(`/academy/${course.slug}`)
        return (
          <NavItem
            key={course.id}
            href={locked ? '#' : `/academy/${course.slug}`}
            label={PILLAR_CONFIG[course.pillarNumber]?.label ?? course.title}
            active={active}
            locked={locked}
            userTier={userTier}
            progressPct={course.progressPct}
          />
        )
      })}

      {/* My Progress section */}
      <Tooltip content="Your overall Academy progress across all pillars and lessons you have access to." className="block mx-4 mt-auto">
      <div
        className="pt-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <p
          className="font-condensed font-bold uppercase tracking-[0.2em] text-[9px] mb-2"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          My Progress
        </p>
        <p
          className="font-display font-black leading-none mb-0.5"
          style={{ fontSize: '36px', color: '#faf9f7' }}
        >
          {overallPct}%
        </p>
        <p
          className="font-condensed font-bold uppercase tracking-[0.15em] text-[9px] mb-2"
          style={{ color: 'rgba(255,255,255,0.25)' }}
        >
          Overall Completion
        </p>
        {/* Progress bar */}
        <div
          className="h-[3px] rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${overallPct}%`, backgroundColor: '#68a2b9' }}
          />
        </div>
      </div>
      </Tooltip>
    </aside>
  )
}

function NavItem({
  href,
  label,
  active,
  locked,
}: {
  href: string
  label: string
  active: boolean
  locked: boolean
  userTier: string | null
  progressPct?: number
}) {
  const baseStyle: React.CSSProperties = {
    color: locked ? 'rgba(255,255,255,0.25)' : active ? '#68a2b9' : 'rgba(255,255,255,0.5)',
    backgroundColor: active ? 'rgba(255,255,255,0.06)' : 'transparent',
    borderLeft: active ? '2px solid #68a2b9' : '2px solid transparent',
    paddingLeft: active ? '18px' : '20px',
    cursor: locked ? 'default' : 'pointer',
  }

  const content = (
    <span className="flex items-center justify-between gap-2 py-[9px] px-5 w-full" style={baseStyle}>
      <span className="font-condensed font-semibold uppercase tracking-[0.12em] text-[12px] truncate min-w-0">
        {label}
      </span>
      {locked && (
        <span
          className="flex-shrink-0 font-condensed font-bold uppercase text-[8px] rounded px-1.5 py-0.5"
          style={{ color: '#ef0e30', backgroundColor: 'rgba(239,14,48,0.12)', border: '1px solid rgba(239,14,48,0.2)' }}
        >
          Pro
        </span>
      )}
    </span>
  )

  if (locked) return <div>{content}</div>
  return <Link href={href}>{content}</Link>
}
