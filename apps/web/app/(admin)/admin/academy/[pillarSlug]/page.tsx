import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

export const dynamic = 'force-dynamic'

interface Props {
  params: { pillarSlug: string }
}

export default async function AdminPillarLessonsPage({ params }: Props) {
  const supabase = createClient()

  const { data: course } = await supabase
    .from('courses')
    .select('id, pillar_number, slug, title, required_tier')
    .eq('slug', params.pillarSlug)
    .single()

  if (!course) notFound()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, slug, sort_order, is_published, content_blocks')
    .eq('course_id', course.id)
    .order('sort_order')

  const config = PILLAR_CONFIG[course.pillar_number] ?? PILLAR_CONFIG[1]

  return (
    <div className="px-8 py-6">
      <div className="mb-6">
        <Link
          href="/admin/academy"
          className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
        >
          ← Academy
        </Link>
        <div className="mt-3">
          <p
            className="font-condensed font-bold uppercase tracking-[0.18em] text-[10px] mb-0.5"
            style={{ color: config.color }}
          >
            {config.label}
          </p>
          <h1 className="font-display font-black text-[28px] text-[#112535]">{course.title}</h1>
          <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
            {(lessons ?? []).length} lessons · click a lesson to build content
          </p>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(27,60,90,0.12)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.03)' }}>
              <th className="px-5 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">#</th>
              <th className="px-5 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">Title</th>
              <th className="px-5 py-3 text-center font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">Blocks</th>
              <th className="px-5 py-3 text-center font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {(lessons ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center font-condensed text-[12px] text-[#7a8a96]">
                  No lessons yet. Add lessons via{' '}
                  <Link href={`/admin/courses/${course.id}`} className="text-[#68a2b9] hover:underline">
                    Courses
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              (lessons ?? []).map((lesson, i) => {
                const blocks = Array.isArray(lesson.content_blocks) ? lesson.content_blocks : []
                return (
                  <tr
                    key={lesson.id}
                    style={{
                      borderBottom: i === (lessons ?? []).length - 1 ? 'none' : '1px solid rgba(27,60,90,0.06)',
                      backgroundColor: 'white',
                    }}
                  >
                    <td className="px-5 py-3">
                      <span className="font-condensed font-bold text-[11px] text-[#7a8a96]">
                        {String(lesson.sort_order).padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-body font-semibold text-[13px] text-[#1b3c5a]">{lesson.title}</p>
                      <p className="font-condensed text-[10px] text-[#7a8a96]">{lesson.slug}</p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="font-condensed font-bold text-[13px] text-[#1b3c5a]">
                        {blocks.length}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className="font-condensed font-bold uppercase text-[9px] rounded px-2 py-0.5"
                        style={{
                          color: lesson.is_published ? '#1b3c5a' : '#7a8a96',
                          backgroundColor: lesson.is_published ? 'rgba(27,60,90,0.06)' : 'rgba(122,138,150,0.08)',
                          border: lesson.is_published ? '1px solid rgba(27,60,90,0.15)' : '1px solid rgba(122,138,150,0.2)',
                        }}
                      >
                        {lesson.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/academy/${params.pillarSlug}/${lesson.id}`}
                        className="font-condensed font-semibold uppercase tracking-wide text-[10px] text-[#68a2b9] hover:text-[#1b3c5a] transition-colors"
                      >
                        Edit Content →
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
