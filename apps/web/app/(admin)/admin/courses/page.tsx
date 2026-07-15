import { adminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import Link from 'next/link'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

export const dynamic = 'force-dynamic'

export default async function AdminCoursesPage() {
  const h = headers()
  if (h.get('RSC') === '1' || h.get('Next-Router-Prefetch') === '1') {
    return null
  }

  // RLS-FIX: adminClient — courses_select_authenticated filters is_published=true,
  // hiding drafts from admins on the SSR client. Mirrors AD2.3 episodes fix.
  const { data: courses } = await adminClient
    .from('courses')
    .select('id, pillar_number, slug, title, required_tier, is_published, sort_order')
    .order('sort_order')

  // Fetch lesson counts per course
  const courseIds = (courses ?? []).map(c => c.id)
  const { data: lessonCounts } = courseIds.length > 0
    ? await adminClient
        .from('lessons')
        .select('course_id, id')
        .in('course_id', courseIds)
        .eq('is_published', true)
    : { data: [] }

  const countMap = new Map<string, number>()
  for (const l of lessonCounts ?? []) {
    countMap.set(l.course_id, (countMap.get(l.course_id) ?? 0) + 1)
  }

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <h1 className="font-display font-black text-[28px] text-[color:var(--admin-text-strong)]">Courses</h1>
        <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)] mt-0.5">
          6 pillar course tracks — manage lessons and content
        </p>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(27,60,90,0.12)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.03)' }}>
              <th className="px-5 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[color:var(--admin-text-2)]">Pillar</th>
              <th className="px-5 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[color:var(--admin-text-2)]">Title</th>
              <th className="px-5 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[color:var(--admin-text-2)]">Tier</th>
              <th className="px-5 py-3 text-right font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[color:var(--admin-text-2)]">Lessons</th>
              <th className="px-5 py-3 text-center font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[color:var(--admin-text-2)]">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(courses ?? []).map((course, i) => (
              <tr
                key={course.id}
                style={{
                  borderBottom: i === (courses ?? []).length - 1 ? 'none' : '1px solid rgba(27,60,90,0.06)',
                  backgroundColor: 'var(--admin-card)',
                }}
              >
                <td className="px-5 py-3">
                  <span
                    className="font-condensed font-bold text-[11px] uppercase tracking-wide"
                    style={{ color: PILLAR_CONFIG[course.pillar_number]?.color ?? '#68a2b9' }}
                  >
                    {PILLAR_CONFIG[course.pillar_number]?.label ?? `P${course.pillar_number}`}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <p className="font-body font-semibold text-[13px] text-[color:var(--admin-text)]">{course.title}</p>
                  <p className="font-condensed text-[10px] text-[color:var(--admin-text-2)]">{course.slug}</p>
                </td>
                <td className="px-5 py-3">
                  <span className="font-condensed text-[11px] text-[color:var(--admin-text)] capitalize">
                    {course.required_tier}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="font-condensed font-bold text-[13px] text-[color:var(--admin-text)]">
                    {countMap.get(course.id) ?? 0}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className="font-condensed font-bold uppercase text-[9px] rounded px-2 py-0.5"
                    style={{
                      color: course.is_published ? '#1b3c5a' : '#7a8a96',
                      backgroundColor: course.is_published ? 'rgba(27,60,90,0.06)' : 'rgba(122,138,150,0.08)',
                      border: course.is_published ? '1px solid rgba(27,60,90,0.15)' : '1px solid rgba(122,138,150,0.2)',
                    }}
                  >
                    {course.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="font-condensed font-semibold uppercase tracking-wide text-[10px] text-[#68a2b9] hover:text-[color:var(--admin-text)] transition-colors"
                  >
                    Manage Lessons →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
