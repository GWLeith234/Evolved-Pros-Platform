import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

export const dynamic = 'force-dynamic'

export default async function AdminAcademyPage() {
  const supabase = createClient()

  const [{ data: courses }, { data: lessons }] = await Promise.all([
    supabase.from('courses').select('id, pillar_number, slug, title, required_tier, is_published').order('pillar_number'),
    supabase.from('lessons').select('course_id, is_published'),
  ])

  const totalMap = new Map<string, number>()
  const pubMap = new Map<string, number>()
  for (const l of lessons ?? []) {
    totalMap.set(l.course_id, (totalMap.get(l.course_id) ?? 0) + 1)
    if (l.is_published) pubMap.set(l.course_id, (pubMap.get(l.course_id) ?? 0) + 1)
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[#112535]">Academy Content Builder</h1>
        <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
          Build lesson content blocks per pillar before filming
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(courses ?? []).map(course => {
          const config = PILLAR_CONFIG[course.pillar_number] ?? PILLAR_CONFIG[1]
          const total = totalMap.get(course.id) ?? 0
          const pub = pubMap.get(course.id) ?? 0
          return (
            <Link
              key={course.id}
              href={`/admin/academy/${course.slug}`}
              className="rounded-lg p-5 transition-all duration-150 hover:shadow-md"
              style={{
                backgroundColor: 'white',
                border: `1px solid rgba(27,60,90,0.1)`,
              }}
              onMouseEnter={undefined}
            >
              {/* Accent bar */}
              <div className="h-[3px] rounded-full mb-4" style={{ backgroundColor: config.color }} />
              <p
                className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] mb-0.5"
                style={{ color: config.color }}
              >
                {config.label}
              </p>
              <h2 className="font-display font-bold text-[16px] text-[#112535] leading-tight mb-3">
                {course.title}
              </h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-condensed text-[11px] text-[#7a8a96]">
                    {total} lesson{total !== 1 ? 's' : ''}
                  </span>
                  <span className="font-condensed text-[11px]" style={{ color: pub > 0 ? '#22c55e' : '#7a8a96' }}>
                    {pub} published
                  </span>
                </div>
                <span
                  className="font-condensed font-bold uppercase text-[9px] rounded px-2 py-0.5"
                  style={{
                    color: course.is_published ? '#1b3c5a' : '#7a8a96',
                    backgroundColor: course.is_published ? 'rgba(27,60,90,0.06)' : 'rgba(122,138,150,0.08)',
                    border: course.is_published ? '1px solid rgba(27,60,90,0.15)' : '1px solid rgba(122,138,150,0.2)',
                  }}
                >
                  {course.is_published ? 'Live' : 'Draft'}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
