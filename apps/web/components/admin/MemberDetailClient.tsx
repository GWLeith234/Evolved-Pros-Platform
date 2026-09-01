'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MemberPlanBadges } from './MemberPlanBadges'

interface Post {
  id: string
  body: string
  created_at: string
  channels: { name: string; slug: string } | null
}

interface LessonProgress {
  lesson_id: string
  completed_at: string | null
  watch_time_seconds: number
  updated_at: string
  lessons: {
    title: string
    course_id: string
    courses: { title: string; pillar_number: number } | null
  } | null
}

interface GuestEngagement {
  id: string
  episode_id: string | null
  status: string
  token_expires_at: string | null
  one_liner: string | null
  short_bio: string | null
  headshot_url: string | null
  topics: unknown
  links: unknown
  av_notes: string | null
  tee_size: string | null
  consent_release: boolean
  submitted_at: string | null
  created_at: string
  episodes: { title: string | null; slug: string | null } | null
}

interface MemberDetail {
  id: string
  email: string | null
  fullName: string | null
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  roleTitle: string | null
  location: string | null
  tier: string | null
  tierStatus: string | null
  tierExpiresAt: string | null
  role: string | null
  isComped: boolean
  guestEngagements: GuestEngagement[]
  points: number
  joinedAt: string
  lastActive: string
  mrr: number
  engagementLevel: string
  engagementScore: number
  postsLast30: number
  lessonsLast30: number
  recentPosts: Post[]
  lessonProgress: LessonProgress[]
}

type Tab = 'overview' | 'activity' | 'progress' | 'guest'

// Hydration-safe UTC formatters — toLocaleDateString depended on the runtime
// timezone / ICU data and threw React #418/#425 hydration warnings.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}
// Same hazard as the dates: Number#toLocaleString varies by ICU build
// (Node prod vs the browser), so a 4-digit points value would render
// "1234" server-side and "1,234" client-side and trip React #418.
function fmtNumber(n: number): string {
  const s = String(Math.trunc(Math.abs(n)))
  const grouped = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return n < 0 ? `-${grouped}` : grouped
}
function fmtDatetime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const h = d.getUTCHours()
  const m = d.getUTCMinutes().toString().padStart(2, '0')
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${h12}:${m} ${period} UTC`
}

const GUEST_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  invited:   { bg: 'rgba(201,168,76,0.12)', color: '#92660b' },
  viewed:    { bg: 'rgba(104,162,185,0.12)', color: '#1b3c5a' },
  submitted: { bg: 'rgba(34,197,94,0.1)',  color: '#15803d' },
  confirmed: { bg: 'rgba(34,197,94,0.14)', color: '#15803d' },
  revoked:   { bg: 'rgba(239,14,48,0.1)',  color: '#ef0e30' },
}

function GuestField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded px-3 py-2" style={{ backgroundColor: 'rgba(27,60,90,0.03)', border: '1px solid rgba(27,60,90,0.08)' }}>
      <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[11px] text-[color:var(--admin-text-2)] mb-1">{label}</p>
      {children}
    </div>
  )
}

export function MemberDetailClient({ member }: { member: MemberDetail }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [tier, setTier]             = useState(member.tier ?? 'vip')
  const [tierStatus, setTierStatus] = useState(member.tierStatus ?? 'active')
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState('')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody]   = useState('')
  const [notifSending, setNotifSending] = useState(false)
  const [notifMsg, setNotifMsg]     = useState('')

  const name = member.displayName ?? member.fullName ?? member.email ?? 'Member'

  async function handleSaveTier() {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`/api/admin/members/${member.id}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, tierStatus }),
      })
      if (res.ok) {
        setSaveMsg('Saved.')
        router.refresh()
      } else {
        setSaveMsg('Failed to save.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleSendNotif() {
    if (!notifTitle.trim() || !notifBody.trim()) return
    setNotifSending(true)
    setNotifMsg('')
    try {
      // Send a personal notification to THIS member only (not a broadcast)
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:  member.id,
          title:    notifTitle.trim(),
          body:     notifBody.trim(),
          type:     'system_general',
        }),
      })
      if (res.ok) {
        setNotifMsg('Notification sent to this member.')
        setNotifTitle('')
        setNotifBody('')
      } else {
        setNotifMsg('Failed to send.')
      }
    } finally {
      setNotifSending(false)
    }
  }

  // Group lesson progress by course
  const progressByCourse: Record<string, { courseTitle: string; pillarNumber: number; lessons: LessonProgress[] }> = {}
  for (const lp of member.lessonProgress) {
    const courseId = lp.lessons?.course_id ?? 'unknown'
    if (!progressByCourse[courseId]) {
      progressByCourse[courseId] = {
        courseTitle:   lp.lessons?.courses?.title ?? 'Unknown Course',
        pillarNumber:  lp.lessons?.courses?.pillar_number ?? 0,
        lessons:       [],
      }
    }
    progressByCourse[courseId].lessons.push(lp)
  }

  const isGuest = member.role === 'guest' || (member.guestEngagements?.length ?? 0) > 0
  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',  label: 'Overview'  },
    { id: 'activity',  label: 'Activity'  },
    { id: 'progress',  label: 'Progress'  },
    ...(isGuest ? [{ id: 'guest' as Tab, label: 'Guest' }] : []),
  ]

  return (
    <div className="px-8 py-6 max-w-4xl">
      {/* Header */}
      <div
        className="rounded-lg p-6 mb-6 flex items-start justify-between"
        style={{ backgroundColor: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded flex-shrink-0 flex items-center justify-center text-white font-condensed font-bold text-lg"
            style={{ backgroundColor: '#1b3c5a' }}
          >
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.avatarUrl} alt={name} className="w-14 h-14 rounded object-cover" />
            ) : name[0]?.toUpperCase()}
          </div>
          <div>
            {member.roleTitle && (
              <p className="font-body font-semibold text-[14px] text-[color:var(--admin-text-strong)]">{member.roleTitle}</p>
            )}
            <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)]">{member.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <MemberPlanBadges role={member.role} tier={member.tier} isComped={member.isComped} />
              {member.tierStatus && (
                <span
                  className="font-condensed font-bold uppercase text-[12px] px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: '#15803d' }}
                >
                  {member.tierStatus.toUpperCase()}
                </span>
              )}
              <span className="font-condensed text-[12px] text-[#c9a84c] font-bold">{member.points} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin actions */}
      <div
        className="rounded-lg p-5 mb-6"
        style={{ backgroundColor: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[12px] text-[color:var(--admin-text)] mb-4">
          Admin Actions
        </p>
        <div className="flex flex-wrap items-end gap-4">
          {/* Tier */}
          <div>
            <label className="block font-condensed font-bold uppercase tracking-[0.14em] text-[12px] text-[color:var(--admin-text-2)] mb-1">
              Tier
            </label>
            <select
              value={tier}
              onChange={e => setTier(e.target.value)}
              className="font-condensed text-[12px] rounded px-2.5 py-1.5 outline-none"
              style={{ border: '1px solid rgba(27,60,90,0.2)', color: 'var(--admin-text-strong)', backgroundColor: 'var(--admin-card)' }}
            >
              <option value="vip">VIP</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block font-condensed font-bold uppercase tracking-[0.14em] text-[12px] text-[color:var(--admin-text-2)] mb-1">
              Status
            </label>
            <select
              value={tierStatus}
              onChange={e => setTierStatus(e.target.value)}
              className="font-condensed text-[12px] rounded px-2.5 py-1.5 outline-none"
              style={{ border: '1px solid rgba(27,60,90,0.2)', color: 'var(--admin-text-strong)', backgroundColor: 'var(--admin-card)' }}
            >
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <button
            onClick={handleSaveTier}
            disabled={saving}
            className="font-condensed font-bold uppercase tracking-wide text-[12px] px-4 py-2 rounded transition-all disabled:opacity-50"
            style={{ backgroundColor: '#1b3c5a', color: 'white' }}
          >
            {saving ? 'Saving…' : 'Update'}
          </button>

          {saveMsg && (
            <span className="font-condensed text-[12px] text-[#15803d]">{saveMsg}</span>
          )}

          {/* Suspend shortcut — requires confirmation to prevent accidental clicks */}
          {member.tierStatus !== 'cancelled' && (
            <button
              onClick={() => {
                const confirmed = window.confirm(
                  `Are you sure you want to suspend ${member.displayName ?? member.fullName ?? member.email}? This will set their membership to cancelled.`
                )
                if (!confirmed) return
                setTierStatus('cancelled')
                void handleSaveTier()
              }}
              className="font-condensed font-bold uppercase tracking-wide text-[12px] px-4 py-2 rounded transition-all ml-auto"
              style={{ color: '#ef0e30', border: '1px solid rgba(239,14,48,0.3)' }}
            >
              Suspend Member
            </button>
          )}
        </div>

        {/* Direct notification */}
        <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(27,60,90,0.08)' }}>
          <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[12px] text-[color:var(--admin-text-2)] mb-3">
            Send Direct Notification
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Title"
              value={notifTitle}
              onChange={e => setNotifTitle(e.target.value)}
              maxLength={100}
              className="font-condensed text-[12px] rounded px-3 py-1.5 outline-none flex-1"
              style={{ border: '1px solid rgba(27,60,90,0.18)', color: 'var(--admin-text-strong)', backgroundColor: 'var(--admin-card)', minWidth: '140px' }}
            />
            <input
              type="text"
              placeholder="Message"
              value={notifBody}
              onChange={e => setNotifBody(e.target.value)}
              maxLength={500}
              className="font-condensed text-[12px] rounded px-3 py-1.5 outline-none flex-[2]"
              style={{ border: '1px solid rgba(27,60,90,0.18)', color: 'var(--admin-text-strong)', backgroundColor: 'var(--admin-card)', minWidth: '200px' }}
            />
            <button
              onClick={handleSendNotif}
              disabled={notifSending || !notifTitle.trim() || !notifBody.trim()}
              className="font-condensed font-bold uppercase tracking-wide text-[12px] px-4 py-1.5 rounded disabled:opacity-50"
              style={{ backgroundColor: '#68a2b9', color: 'white' }}
            >
              {notifSending ? 'Sending…' : 'Send'}
            </button>
          </div>
          {notifMsg && <p className="font-condensed text-[12px] text-[#15803d] mt-1">{notifMsg}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-5" style={{ borderBottom: '1px solid rgba(27,60,90,0.1)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px] px-5 py-3 transition-all relative"
            style={{ color: tab === t.id ? '#1b3c5a' : '#7a8a96' }}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: '#1b3c5a' }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Joined',         value: fmtDate(member.joinedAt) },
            { label: 'Last Active',    value: fmtDate(member.lastActive) },
            { label: 'Points',         value: fmtNumber(member.points) },
            { label: 'MRR',            value: member.mrr > 0 ? `$${member.mrr}/mo` : '—' },
            { label: 'Engagement',     value: member.engagementLevel },
            { label: 'Posts (30d)',    value: String(member.postsLast30) },
            { label: 'Lessons (30d)',  value: String(member.lessonsLast30) },
            { label: 'Role Title',     value: member.roleTitle ?? '—' },
            { label: 'Location',       value: member.location ?? '—' },
          ].map(item => (
            <div
              key={item.label}
              className="rounded px-4 py-3"
              style={{ backgroundColor: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.08)' }}
            >
              <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[12px] text-[color:var(--admin-text-2)] mb-0.5">{item.label}</p>
              <p className="font-condensed font-semibold text-[14px] text-[color:var(--admin-text-strong)]">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'activity' && (
        <div className="space-y-2">
          {member.recentPosts.length === 0 ? (
            <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)]">No recent posts.</p>
          ) : (
            member.recentPosts.map(post => (
              <div
                key={post.id}
                className="rounded p-4"
                style={{ backgroundColor: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.08)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-condensed font-bold text-[12px] text-[#68a2b9]">
                    #{(post.channels as { name: string; slug: string } | null)?.slug ?? 'general'}
                  </span>
                  <span className="font-condensed text-[12px] text-[color:var(--admin-text-2)]">{fmtDatetime(post.created_at)}</span>
                </div>
                <p className="font-body text-[13px] text-[color:var(--admin-text-strong)] line-clamp-2">{post.body}</p>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'progress' && (
        <div className="space-y-4">
          {Object.values(progressByCourse).sort((a, b) => a.pillarNumber - b.pillarNumber).map(group => {
            const completed = group.lessons.filter(l => l.completed_at).length
            const total     = group.lessons.length
            const pct       = total > 0 ? Math.round((completed / total) * 100) : 0
            return (
              <div
                key={group.courseTitle}
                className="rounded-lg p-4"
                style={{ backgroundColor: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.08)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-condensed font-bold text-[12px] text-[#68a2b9] mr-2">P{group.pillarNumber}</span>
                    <span className="font-condensed font-semibold text-[13px] text-[color:var(--admin-text-strong)]">{group.courseTitle}</span>
                  </div>
                  <span className="font-condensed font-bold text-[12px] text-[color:var(--admin-text)]">{completed}/{total} ({pct}%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(27,60,90,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#68a2b9' }} />
                </div>
              </div>
            )
          })}
          {Object.keys(progressByCourse).length === 0 && (
            <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)]">No lesson progress recorded.</p>
          )}
        </div>
      )}

      {tab === 'guest' && (
        <div className="space-y-4">
          {member.guestEngagements.length === 0 ? (
            <p className="font-condensed text-[12px] text-[color:var(--admin-text-2)]">
              No guest engagements for this member.
            </p>
          ) : (
            member.guestEngagements.map(g => {
              const topics = Array.isArray(g.topics) ? (g.topics as unknown[]) : []
              const links = Array.isArray(g.links) ? (g.links as unknown[]) : []
              const expired = g.token_expires_at ? new Date(g.token_expires_at).getTime() < Date.now() : false
              const badge = GUEST_STATUS_COLORS[g.status] ?? { bg: 'rgba(27,60,90,0.08)', color: 'var(--admin-text-2)' }
              return (
                <div
                  key={g.id}
                  className="rounded-lg p-5"
                  style={{ backgroundColor: 'var(--admin-card)', border: '1px solid rgba(27,60,90,0.1)' }}
                >
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-condensed font-bold uppercase text-[12px] px-2 py-0.5 rounded"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {g.status}
                      </span>
                      {g.episodes?.title && (
                        <span className="font-condensed text-[12px] text-[color:var(--admin-text)]">
                          {g.episodes.title}
                        </span>
                      )}
                      {expired && (
                        <span className="font-condensed font-bold uppercase text-[12px] px-2 py-0.5 rounded"
                          style={{ backgroundColor: 'rgba(239,14,48,0.08)', color: '#ef0e30' }}>
                          link expired
                        </span>
                      )}
                    </div>
                    <span className="font-condensed text-[12px] text-[color:var(--admin-text-2)]">
                      {g.submitted_at ? `Submitted ${fmtDate(g.submitted_at)}` : `Invited ${fmtDate(g.created_at)}`}
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    {g.headshot_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={g.headshot_url} alt="Guest headshot" className="w-16 h-16 rounded object-cover flex-shrink-0"
                        style={{ border: '1px solid rgba(27,60,90,0.15)' }} />
                    )}
                    <div className="min-w-0 flex-1 space-y-2">
                      {g.one_liner && (
                        <p className="font-body text-[13px] text-[color:var(--admin-text-strong)] italic">&ldquo;{g.one_liner}&rdquo;</p>
                      )}
                      {g.short_bio && (
                        <p className="font-body text-[13px] text-[color:var(--admin-text-2)] line-clamp-4">{g.short_bio}</p>
                      )}
                    </div>
                  </div>

                  {(topics.length > 0 || links.length > 0 || g.tee_size || g.av_notes) && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {topics.length > 0 && (
                        <GuestField label="Topics">
                          <div className="flex flex-wrap gap-1">
                            {topics.map((t, i) => (
                              <span key={i} className="font-condensed text-[12px] px-2 py-0.5 rounded"
                                style={{ backgroundColor: 'rgba(104,162,185,0.1)', color: '#1b3c5a' }}>
                                {String(t)}
                              </span>
                            ))}
                          </div>
                        </GuestField>
                      )}
                      {links.length > 0 && (
                        <GuestField label="Links">
                          <div className="flex flex-col gap-0.5">
                            {links.map((l, i) => {
                              const url = typeof l === 'string' ? l : String((l as any)?.url ?? '')
                              const label = typeof l === 'string' ? l : String((l as any)?.label || url)
                              if (!url) return null
                              return (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                  className="font-condensed text-[12px] text-[#68a2b9] truncate">
                                  {label}
                                </a>
                              )
                            })}
                          </div>
                        </GuestField>
                      )}
                      {g.tee_size && (
                        <GuestField label="Tee size">
                          <span className="font-condensed text-[13px] text-[color:var(--admin-text-strong)]">{g.tee_size}</span>
                        </GuestField>
                      )}
                      {g.av_notes && (
                        <GuestField label="A/V notes">
                          <span className="font-condensed text-[12px] text-[color:var(--admin-text-2)]">{g.av_notes}</span>
                        </GuestField>
                      )}
                      <GuestField label="Recording release">
                        <span className="font-condensed text-[13px]" style={{ color: g.consent_release ? '#15803d' : '#ef0e30' }}>
                          {g.consent_release ? 'Consented' : 'Not yet'}
                        </span>
                      </GuestField>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
