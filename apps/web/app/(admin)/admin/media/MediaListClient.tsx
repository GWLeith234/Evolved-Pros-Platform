'use client'

import Link from 'next/link'
import { useState } from 'react'

interface Story {
  id: string
  title: string
  slug: string
  pillar: string | null
  story_type: string
  is_published: boolean
  is_featured: boolean
  published_at: string | null
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  original: 'Original',
  pioneer_spin: 'Pioneer Spin',
  redirect: 'Redirect',
}

function formatDate(iso: string | null): string {
  if (!iso) return '\u2014'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function MediaListClient({
  initialStories,
  pillarLabels,
}: {
  initialStories: Story[]
  pillarLabels: Record<string, string>
}) {
  const [stories, setStories] = useState(initialStories)

  async function togglePublish(id: string, current: boolean) {
    const next = !current
    setStories(prev => prev.map(s => s.id === id ? { ...s, is_published: next } : s))

    const res = await fetch(`/api/admin/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_published: next,
        published_at: next ? new Date().toISOString() : null,
      }),
    })
    if (!res.ok) {
      setStories(prev => prev.map(s => s.id === id ? { ...s, is_published: current } : s))
    }
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(27,60,90,0.1)' }}>
      <table className="w-full text-left">
        <thead>
          <tr style={{ backgroundColor: 'rgba(27,60,90,0.03)', borderBottom: '1px solid rgba(27,60,90,0.08)' }}>
            {['Title', 'Pillar', 'Type', 'Status', 'Featured', 'Published', 'Actions'].map(h => (
              <th key={h} className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] px-4 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stories.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center font-condensed text-[13px] text-[#7a8a96]">
                No stories yet. Click &quot;+ New Story&quot; to create one.
              </td>
            </tr>
          ) : (
            stories.map(story => (
              <tr
                key={story.id}
                className="transition-colors"
                style={{ borderBottom: '1px solid rgba(27,60,90,0.06)' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(27,60,90,0.02)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <td className="px-4 py-3 font-body text-[13px] text-[#1b3c5a] font-semibold max-w-[250px] truncate">
                  {story.title}
                </td>
                <td className="px-4 py-3 font-condensed text-[12px] text-[#7a8a96]">
                  {story.pillar ? pillarLabels[story.pillar] ?? story.pillar : '\u2014'}
                </td>
                <td className="px-4 py-3 font-condensed text-[12px] text-[#7a8a96]">
                  {TYPE_LABELS[story.story_type] ?? story.story_type}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => togglePublish(story.id, story.is_published)}
                    className="font-condensed font-bold uppercase tracking-[0.12em] text-[9px] px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: story.is_published ? 'rgba(10,191,163,0.1)' : 'rgba(27,60,90,0.06)',
                      color: story.is_published ? '#0ABFA3' : '#7a8a96',
                      border: `1px solid ${story.is_published ? 'rgba(10,191,163,0.2)' : 'rgba(27,60,90,0.1)'}`,
                    }}
                  >
                    {story.is_published ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="px-4 py-3 font-condensed text-[12px] text-[#7a8a96]">
                  {story.is_featured ? '\u2605' : '\u2014'}
                </td>
                <td className="px-4 py-3 font-condensed text-[12px] text-[#7a8a96]">
                  {formatDate(story.published_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/media/${story.id}/edit`}
                    className="font-condensed font-semibold text-[11px] text-[#68a2b9] hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
