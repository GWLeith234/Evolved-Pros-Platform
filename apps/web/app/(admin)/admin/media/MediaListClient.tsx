'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  AdminChip,
  AdminStatusChip,
  AdminTable,
  AdminTd,
  AdminTh,
  AdminToggle,
} from '@/components/admin/template'

interface Story {
  id: string
  title: string
  slug: string
  pillar: string | null
  story_type: string
  is_published: boolean | null
  is_featured: boolean | null
  published_at: string | null
  created_at: string | null
}

const TYPE_LABELS: Record<string, string> = {
  original: 'Original',
  pioneer_spin: 'Pioneer Spin',
  redirect: 'Redirect',
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Not published'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function MediaListClient({
  initialStories,
  pillarLabels,
}: {
  initialStories: Story[]
  pillarLabels: Record<string, string>
}) {
  const [stories] = useState(initialStories)

  return (
    <AdminTable title="Story library" count={`${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`}>
      <thead>
        <tr>
          {['Title', 'Pillar', 'Type', 'Status', 'Featured', 'Published', 'Edit'].map(h => (
            <AdminTh key={h}>{h}</AdminTh>
          ))}
        </tr>
      </thead>
      <tbody>
        {stories.length === 0 ? (
          <tr>
            <AdminTd label="Title" colSpan={7}>
              No stories yet. Use New Story to create one.
            </AdminTd>
          </tr>
        ) : (
          stories.map(story => (
            <tr key={story.id}>
              <AdminTd label="Title">
                <span className="ep-admin-el-move">{story.title}</span>
              </AdminTd>
              <AdminTd label="Pillar">
                {story.pillar ? (pillarLabels[story.pillar] ?? story.pillar) : 'n/a'}
              </AdminTd>
              <AdminTd label="Type">
                <AdminChip tone="data">{TYPE_LABELS[story.story_type] ?? story.story_type}</AdminChip>
              </AdminTd>
              <AdminTd label="Status">
                <AdminStatusChip status={story.is_published ? 'published' : 'draft'}>
                  {story.is_published ? 'Published' : 'Draft'}
                </AdminStatusChip>
              </AdminTd>
              <AdminTd label="Featured">
                <AdminToggle
                  on={!!story.is_featured}
                  label={story.is_featured ? 'Featured' : 'Not featured'}
                />
              </AdminTd>
              <AdminTd label="Published">{formatDate(story.published_at)}</AdminTd>
              <AdminTd label="Edit">
                <Link href={`/admin/media/${story.id}/edit`} className="ep-admin-el-edit">
                  Edit
                </Link>
              </AdminTd>
            </tr>
          ))
        )}
      </tbody>
    </AdminTable>
  )
}
