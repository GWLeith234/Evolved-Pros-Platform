'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDurationSeconds } from '@/lib/academy/types'

interface Lesson {
  id: string
  title: string
  slug: string
  description: string | null
  duration_seconds: number | null
  sort_order: number
  is_published: boolean
  mux_playback_id: string | null
}

interface AdminLessonsTableProps {
  lessons: Lesson[]
  courseId: string
}

export function AdminLessonsTable({ lessons: initial, courseId }: AdminLessonsTableProps) {
  const [lessons, setLessons] = useState(initial)
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()

  async function togglePublish(id: string, current: boolean) {
    setToggling(id)
    try {
      const res = await fetch(`/api/admin/lessons/${id}/publish`, { method: 'PATCH' })
      if (res.ok) {
        setLessons(prev => prev.map(l => l.id === id ? { ...l, is_published: !current } : l))
      }
    } finally {
      setToggling(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this lesson? This cannot be undone.')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/lessons/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setLessons(prev => prev.filter(l => l.id !== id))
        router.refresh()
      }
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(27,60,90,0.12)' }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.03)' }}>
            <th className="px-5 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">#</th>
            <th className="px-5 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">Title</th>
            <th className="px-5 py-3 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">Duration</th>
            <th className="px-5 py-3 text-center font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">Video</th>
            <th className="px-5 py-3 text-center font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">Status</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {lessons.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center font-condensed text-[12px] text-[#7a8a96]">
                No lessons yet.
              </td>
            </tr>
          ) : (
            lessons.map((lesson, i) => (
              <tr
                key={lesson.id}
                style={{
                  borderBottom: i === lessons.length - 1 ? 'none' : '1px solid rgba(27,60,90,0.06)',
                  backgroundColor: 'white',
                }}
              >
                <td className="px-5 py-3">
                  <span className="font-condensed font-bold text-[11px] text-[#7a8a96]">
                    {String(lesson.sort_order).padStart(2, '0')}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <p className="font-body font-semibold text-[13px] text-[#1b3c5a] truncate max-w-[280px]">{lesson.title}</p>
                  <p className="font-condensed text-[10px] text-[#7a8a96]">{lesson.slug}</p>
                </td>
                <td className="px-5 py-3">
                  <span className="font-condensed text-[12px] text-[#1b3c5a]">
                    {formatDurationSeconds(lesson.duration_seconds) || '—'}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  <span
                    className="font-condensed font-bold uppercase text-[9px] rounded px-2 py-0.5"
                    style={{
                      color: lesson.mux_playback_id ? '#22c55e' : '#7a8a96',
                      backgroundColor: lesson.mux_playback_id ? 'rgba(34,197,94,0.08)' : 'rgba(122,138,150,0.08)',
                      border: lesson.mux_playback_id ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(122,138,150,0.2)',
                    }}
                  >
                    {lesson.mux_playback_id ? 'Ready' : 'No Video'}
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
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => togglePublish(lesson.id, lesson.is_published)}
                      disabled={toggling === lesson.id}
                      className="font-condensed font-semibold uppercase tracking-wide text-[10px] transition-colors disabled:opacity-50"
                      style={{ color: lesson.is_published ? '#ef0e30' : '#68a2b9' }}
                    >
                      {toggling === lesson.id ? '...' : lesson.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <Link
                      href={`/admin/courses/${courseId}/lessons/${lesson.id}/edit`}
                      className="font-condensed font-semibold uppercase tracking-wide text-[10px] text-[#68a2b9] hover:text-[#1b3c5a] transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(lesson.id)}
                      disabled={deleting === lesson.id}
                      className="font-condensed font-semibold uppercase tracking-wide text-[10px] text-[#ef0e30] disabled:opacity-50"
                    >
                      {deleting === lesson.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
