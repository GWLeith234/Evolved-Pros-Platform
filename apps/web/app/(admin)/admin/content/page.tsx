import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminContentPage() {
  const supabase = createClient()

  const [coursesResult, eventsResult, lessonsResult] = await Promise.all([
    supabase.from('courses').select('id, title, pillar_number, is_published, required_tier').order('pillar_number'),
    supabase.from('events').select('id, title, event_type, starts_at, is_published').order('starts_at', { ascending: false }).limit(10),
    supabase.from('lessons').select('course_id, is_published'),
  ])

  const courses = coursesResult.data ?? []
  const events  = eventsResult.data ?? []
  const lessons = lessonsResult.data ?? []

  const lessonsByCourse = lessons.reduce<Record<string, { total: number; published: number }>>((acc, l) => {
    if (!acc[l.course_id]) acc[l.course_id] = { total: 0, published: 0 }
    acc[l.course_id].total++
    if (l.is_published) acc[l.course_id].published++
    return acc
  }, {})

  const totalLessons    = lessons.length
  const publishedCourses = courses.filter(c => c.is_published).length
  const publishedEvents  = events.filter(e => e.is_published).length

  return (
    <div className="px-8 py-6 max-w-4xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display font-black text-[28px] text-[#112535]">Content</h1>
          <p className="font-condensed text-[12px] text-[#7a8a96] mt-0.5">
            {publishedCourses} published courses · {totalLessons} lessons · {publishedEvents} upcoming events
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Courses */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}
          >
            <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px] text-[#1b3c5a]">
              Courses
            </p>
            <Link
              href="/admin/courses"
              className="font-condensed text-[10px] text-[#68a2b9] hover:text-[#1b3c5a] transition-colors"
            >
              Manage →
            </Link>
          </div>
          <div>
            {courses.map((c, i) => {
              const counts = lessonsByCourse[c.id] ?? { total: 0, published: 0 }
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderBottom: i === courses.length - 1 ? 'none' : '1px solid rgba(27,60,90,0.06)' }}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-condensed font-bold text-[10px] text-[#68a2b9]">P{c.pillar_number}</span>
                    <div>
                      <p className="font-body font-semibold text-[12px] text-[#112535]">{c.title}</p>
                      <p className="font-condensed text-[10px] text-[#7a8a96]">{counts.published}/{counts.total} lessons</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-condensed font-bold uppercase text-[8px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: c.is_published ? 'rgba(34,197,94,0.08)' : 'rgba(27,60,90,0.06)',
                        color: c.is_published ? '#15803d' : '#7a8a96',
                      }}
                    >
                      {c.is_published ? 'Live' : 'Draft'}
                    </span>
                    <Link
                      href={`/admin/courses/${c.id}`}
                      className="font-condensed text-[10px] text-[#68a2b9] hover:text-[#1b3c5a] transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Events */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderBottom: '1px solid rgba(27,60,90,0.08)' }}
          >
            <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px] text-[#1b3c5a]">
              Events
            </p>
            <Link
              href="/admin/events"
              className="font-condensed text-[10px] text-[#68a2b9] hover:text-[#1b3c5a] transition-colors"
            >
              Manage →
            </Link>
          </div>
          <div>
            {events.length === 0 ? (
              <p className="px-5 py-4 font-condensed text-[12px] text-[#7a8a96]">No events yet.</p>
            ) : (
              events.map((ev, i) => {
                const date = new Date(ev.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                return (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderBottom: i === events.length - 1 ? 'none' : '1px solid rgba(27,60,90,0.06)' }}
                  >
                    <div>
                      <p className="font-body font-semibold text-[12px] text-[#112535]">{ev.title}</p>
                      <p className="font-condensed text-[10px] text-[#7a8a96]">{date} · {ev.event_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-condensed font-bold uppercase text-[8px] px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: ev.is_published ? 'rgba(34,197,94,0.08)' : 'rgba(27,60,90,0.06)',
                          color: ev.is_published ? '#15803d' : '#7a8a96',
                        }}
                      >
                        {ev.is_published ? 'Live' : 'Draft'}
                      </span>
                      <Link
                        href={`/admin/events/${ev.id}/edit`}
                        className="font-condensed text-[10px] text-[#68a2b9] hover:text-[#1b3c5a] transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Broadcast CTA */}
      <div
        className="rounded-lg p-5 mt-6 flex items-center justify-between"
        style={{ backgroundColor: 'rgba(27,60,90,0.04)', border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <div>
          <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[11px] text-[#1b3c5a]">
            Broadcast Notification
          </p>
          <p className="font-condensed text-[11px] text-[#7a8a96] mt-0.5">
            Send an announcement to all or specific tier members
          </p>
        </div>
        <Link
          href="/admin/broadcast"
          className="font-condensed font-bold uppercase tracking-wide text-[11px] px-5 py-2.5 rounded transition-all"
          style={{ backgroundColor: '#1b3c5a', color: 'white' }}
        >
          Go to Broadcast →
        </Link>
      </div>
    </div>
  )
}
