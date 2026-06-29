'use client'

import { useState } from 'react'

const PILLAR_COLORS: Record<string, string> = {
  Foundation: '#FFA538', Identity: '#A78BFA', 'Mental Toughness': '#F87171',
  Strategy: '#60A5FA', Accountability: '#C9A84C', Execution: '#0ABFA3',
}

const DAY_ABBR: Record<number, string> = { 0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT' }

interface Post {
  id: string
  body: string
  status: string
  scheduled_at: string
  pillar?: string
  slot?: string
  tier?: string
}

interface Props {
  post: Post
  onAction: (postId: string, action: 'approve' | 'reject', body?: string) => void
}

export function PostQueueItem({ post, onAction }: Props) {
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(post.body)

  const date = new Date(post.scheduled_at)
  const day = DAY_ABBR[date.getDay()] ?? '---'
  const time = (post as unknown as Record<string, unknown>).displayTime as string ?? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const pillarColor = PILLAR_COLORS[post.pillar ?? ''] ?? '#7a8a96'
  const statusColor = post.status === 'approved' || post.status === 'published' ? '#0ABFA3' : post.status === 'scheduled' ? '#C9A84C' : '#7a8a96'
  const tierColor = post.tier === 'peak' ? '#0ABFA3' : '#C9A84C'

  return (
    <div
      className="rounded-lg p-4 flex gap-4"
      style={{ backgroundColor: '#111926', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Day badge */}
      <div className="flex-shrink-0 text-center" style={{ width: 44 }}>
        <p className="font-condensed font-black text-[18px] leading-none" style={{ color: 'rgba(255,255,255,0.6)' }}>{day}</p>
        <p suppressHydrationWarning className="font-condensed text-[12px]" style={{ color: 'rgba(255,255,255,0.25)' }}>{time}</p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={3}
              className="w-full rounded px-3 py-2 text-[13px] font-body resize-none outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { onAction(post.id, 'approve', editBody); setEditing(false) }}
                className="font-condensed font-bold uppercase tracking-wide text-[12px] px-3 py-1 rounded"
                style={{ backgroundColor: '#0ABFA3', color: '#fff' }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => { setEditBody(post.body); setEditing(false) }}
                className="font-condensed text-[12px]"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="font-body text-[13px] leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {post.body}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-2">
          {post.pillar && (
            <span className="font-condensed font-bold uppercase tracking-[0.1em] text-[8px] px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${pillarColor}18`, color: pillarColor, border: `1px solid ${pillarColor}30` }}>
              {post.pillar}
            </span>
          )}
          {post.slot && (
            <span className="font-condensed text-[12px]" style={{ color: tierColor }}>
              {post.tier === 'peak' ? '\u2605' : '\u2022'} {post.slot}
            </span>
          )}
          <span className="font-condensed text-[8px] flex items-center gap-1" style={{ color: statusColor }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusColor, display: 'inline-block' }} />
            {post.status}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-start gap-1.5">
        {post.status === 'scheduled' && (
          <button
            type="button"
            onClick={() => onAction(post.id, 'approve')}
            className="font-condensed font-bold uppercase tracking-wide text-[12px] px-3 py-1.5 rounded transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'rgba(10,191,163,0.12)', color: '#0ABFA3', border: '1px solid rgba(10,191,163,0.25)' }}
          >
            Approve
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="font-condensed text-[12px] px-2 py-1.5 rounded"
          style={{ color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Edit
        </button>
        {post.status === 'scheduled' && (
          <button
            type="button"
            onClick={() => onAction(post.id, 'reject')}
            className="font-condensed text-[12px] px-2 py-1.5 rounded"
            style={{ color: '#ef0e30', border: '1px solid rgba(239,14,48,0.15)' }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
