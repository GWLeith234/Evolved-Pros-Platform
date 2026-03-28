'use client'

import { useState } from 'react'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { Card, CardBody, CardHeader } from '@evolved-pros/ui'

type Tab = 'overview' | 'progress' | 'points' | 'edit'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'progress', label: 'Progress' },
  { key: 'points', label: 'Points' },
  { key: 'edit', label: 'Edit Profile' },
]

export type OverviewPost = {
  id: string
  body: string
  created_at: string
  like_count: number
  reply_count: number
  channels: { name: string; slug: string } | null
}

export type CourseProgressItem = {
  id: string
  title: string
  total: number
  completed: number
  pct: number
}

export type PointsEntry = {
  id: string
  icon: string
  description: string
  points: number
  date: string
}

export type ProfileForEdit = {
  display_name: string | null
  full_name: string | null
  bio: string | null
  role_title: string | null
  location: string | null
  avatar_url: string | null
  company: string | null
  linkedin_url: string | null
  website_url: string | null
  twitter_handle: string | null
  phone: string | null
  phone_visible: boolean
  current_pillar: string | null
  goal_90day: string | null
  goal_visible: boolean
}

interface ProfileTabsProps {
  userId: string
  initialTab: Tab
  overviewPosts: OverviewPost[]
  courseProgress: CourseProgressItem[]
  pointsEntries: PointsEntry[]
  profile: ProfileForEdit
}

export function ProfileTabs({
  userId,
  initialTab,
  overviewPosts,
  courseProgress,
  pointsEntries,
  profile,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)

  return (
    <>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[rgba(27,60,90,0.12)]">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className="px-4 py-2.5 font-condensed font-semibold uppercase tracking-wide text-xs transition-colors border-b-2 -mb-px"
            style={{
              color: activeTab === t.key ? '#68a2b9' : '#7a8a96',
              borderColor: activeTab === t.key ? '#68a2b9' : 'transparent',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {overviewPosts.length === 0 ? (
            <Card>
              <CardBody>
                <p className="font-condensed text-xs uppercase tracking-widest text-[#7a8a96] text-center py-4">
                  No posts yet
                </p>
              </CardBody>
            </Card>
          ) : (
            overviewPosts.map(post => (
              <Card key={post.id}>
                <CardBody>
                  {post.channels && (
                    <p className="font-condensed text-[10px] font-bold uppercase tracking-widest text-[#68a2b9] mb-1">
                      #{post.channels.name}
                    </p>
                  )}
                  <p className="font-body text-sm text-[#1b3c5a] leading-relaxed mb-2">
                    {post.body}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="font-condensed text-[10px] text-[#7a8a96]">
                      {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="font-condensed text-[10px] text-[#7a8a96]">♥ {post.like_count}</span>
                    <span className="font-condensed text-[10px] text-[#7a8a96]">↩ {post.reply_count}</span>
                  </div>
                </CardBody>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Progress */}
      {activeTab === 'progress' && (
        <div className="space-y-3">
          {courseProgress.map(c => {
            const isDone = c.pct === 100
            return (
              <Card key={c.id}>
                <CardBody>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-body font-semibold text-sm text-[#1b3c5a]">{c.title}</span>
                    <span className="font-condensed font-bold text-xs" style={{ color: isDone ? '#22c55e' : '#68a2b9' }}>
                      {c.completed} / {c.total} lessons · {c.pct}%
                    </span>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: '4px', backgroundColor: 'rgba(27,60,90,0.12)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${c.pct}%`, backgroundColor: isDone ? '#22c55e' : '#68a2b9' }}
                    />
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* Points */}
      {activeTab === 'points' && (
        <div className="space-y-3">
          <h2 className="font-condensed font-bold uppercase tracking-widest text-xs text-[#7a8a96] mb-3">
            Points Activity
          </h2>
          {pointsEntries.length === 0 ? (
            <div className="rounded-lg p-8 text-center" style={{ backgroundColor: '#112535' }}>
              <p className="font-condensed text-xs uppercase tracking-widest" style={{ color: '#7a8a96' }}>
                No activity yet
              </p>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#112535', border: '1px solid rgba(255,255,255,0.06)' }}>
              {pointsEntries.map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 px-4 py-3"
                  style={{ borderBottom: i < pointsEntries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  <div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center text-sm" style={{ backgroundColor: 'rgba(104,162,185,0.1)' }}>
                    {entry.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {entry.description}
                    </p>
                    <p className="font-condensed text-[10px] mt-0.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.30)' }}>
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="font-condensed font-bold text-sm" style={{ color: '#68a2b9' }}>+{entry.points}</span>
                    <p className="font-condensed text-[8px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Profile */}
      {activeTab === 'edit' && (
        <Card>
          <CardHeader title="Edit Profile" />
          <CardBody>
            <ProfileEditForm userId={userId} profile={profile} />
          </CardBody>
        </Card>
      )}
    </>
  )
}
