'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getVendastaCrmUrl } from '@/lib/admin/helpers'

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

interface VendastaWebhook {
  id: string
  event_type: string
  vendasta_order_id: string | null
  product_sku: string | null
  processed_at: string
  status: string
  error_message: string | null
}

interface MemberDetail {
  id: string
  email: string
  fullName: string | null
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  roleTitle: string | null
  location: string | null
  tier: string | null
  tierStatus: string | null
  tierExpiresAt: string | null
  vendastaContactId: string | null
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
  vendastaWebhooks: VendastaWebhook[]
}

type Tab = 'overview' | 'activity' | 'progress' | 'vendasta'

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDatetime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  success: { bg: 'rgba(34,197,94,0.1)',  color: '#15803d' },
  error:   { bg: 'rgba(239,14,48,0.1)',  color: '#ef0e30' },
}

export function MemberDetailClient({ member }: { member: MemberDetail }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [tier, setTier]             = useState(member.tier ?? 'community')
  const [tierStatus, setTierStatus] = useState(member.tierStatus ?? 'active')
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState('')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody]   = useState('')
  const [notifSending, setNotifSending] = useState(false)
  const [notifMsg, setNotifMsg]     = useState('')

  const name = member.displayName ?? member.fullName ?? member.email

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
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:    notifTitle.trim(),
          message:  notifBody.trim(),
          audience: 'all',
          type:     'system_general',
        }),
      })
      if (res.ok) {
        setNotifMsg('Notification sent.')
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

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',  label: 'Overview'  },
    { id: 'activity',  label: 'Activity'  },
    { id: 'progress',  label: 'Progress'  },
    { id: 'vendasta',  label: 'Vendasta'  },
  ]

  return (
    <div className="px-8 py-6 max-w-4xl">
      {/* Header */}
      <div
        className="rounded-lg p-6 mb-6 flex items-start justify-between"
        style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
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
            <h2 className="font-display font-black text-[22px] text-[#112535]">{name}</h2>
            <p className="font-condensed text-[12px] text-[#7a8a96]">{member.email}</p>
            <div className="flex items-center gap-2 mt-1">
              {member.tier && (
                <span
                  className="font-condensed font-bold uppercase text-[9px] px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(27,60,90,0.06)', color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.15)' }}
                >
                  {member.tier}
                </span>
              )}
              {member.tierStatus && (
                <span
                  className="font-condensed font-bold uppercase text-[9px] px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'rgba(34,197,94,0.08)', color: '#15803d' }}
                >
                  {member.tierStatus}
                </span>
              )}
              <span className="font-condensed text-[10px] text-[#c9a84c] font-bold">{member.points} pts</span>
            </div>
          </div>
        </div>

        {member.vendastaContactId && (
          <a
            href={getVendastaCrmUrl(member.vendastaContactId)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-condensed font-semibold uppercase tracking-wide text-[10px] px-3 py-2 rounded transition-all"
            style={{ color: '#68a2b9', border: '1px solid rgba(104,162,185,0.3)' }}
          >
            View in Vendasta CRM →
          </a>
        )}
      </div>

      {/* Admin actions */}
      <div
        className="rounded-lg p-5 mb-6"
        style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[10px] text-[#1b3c5a] mb-4">
          Admin Actions
        </p>
        <div className="flex flex-wrap items-end gap-4">
          {/* Tier */}
          <div>
            <label className="block font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-1">
              Tier
            </label>
            <select
              value={tier}
              onChange={e => setTier(e.target.value)}
              className="font-condensed text-[12px] rounded px-2.5 py-1.5 outline-none"
              style={{ border: '1px solid rgba(27,60,90,0.2)', color: '#112535', backgroundColor: 'white' }}
            >
              <option value="community">Community</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-1">
              Status
            </label>
            <select
              value={tierStatus}
              onChange={e => setTierStatus(e.target.value)}
              className="font-condensed text-[12px] rounded px-2.5 py-1.5 outline-none"
              style={{ border: '1px solid rgba(27,60,90,0.2)', color: '#112535', backgroundColor: 'white' }}
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
            className="font-condensed font-bold uppercase tracking-wide text-[11px] px-4 py-2 rounded transition-all disabled:opacity-50"
            style={{ backgroundColor: '#1b3c5a', color: 'white' }}
          >
            {saving ? 'Saving…' : 'Update'}
          </button>

          {saveMsg && (
            <span className="font-condensed text-[11px] text-[#15803d]">{saveMsg}</span>
          )}

          {/* Suspend shortcut */}
          {member.tierStatus !== 'cancelled' && (
            <button
              onClick={() => { setTierStatus('cancelled'); void handleSaveTier() }}
              className="font-condensed font-bold uppercase tracking-wide text-[11px] px-4 py-2 rounded transition-all ml-auto"
              style={{ color: '#ef0e30', border: '1px solid rgba(239,14,48,0.3)' }}
            >
              Suspend Member
            </button>
          )}
        </div>

        {/* Direct notification */}
        <div className="mt-5 pt-5" style={{ borderTop: '1px solid rgba(27,60,90,0.08)' }}>
          <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-3">
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
              style={{ border: '1px solid rgba(27,60,90,0.18)', color: '#112535', backgroundColor: 'white', minWidth: '140px' }}
            />
            <input
              type="text"
              placeholder="Message"
              value={notifBody}
              onChange={e => setNotifBody(e.target.value)}
              maxLength={500}
              className="font-condensed text-[12px] rounded px-3 py-1.5 outline-none flex-[2]"
              style={{ border: '1px solid rgba(27,60,90,0.18)', color: '#112535', backgroundColor: 'white', minWidth: '200px' }}
            />
            <button
              onClick={handleSendNotif}
              disabled={notifSending || !notifTitle.trim() || !notifBody.trim()}
              className="font-condensed font-bold uppercase tracking-wide text-[11px] px-4 py-1.5 rounded disabled:opacity-50"
              style={{ backgroundColor: '#68a2b9', color: 'white' }}
            >
              {notifSending ? 'Sending…' : 'Send'}
            </button>
          </div>
          {notifMsg && <p className="font-condensed text-[11px] text-[#15803d] mt-1">{notifMsg}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-5" style={{ borderBottom: '1px solid rgba(27,60,90,0.1)' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[11px] px-5 py-3 transition-all relative"
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
            { label: 'Points',         value: member.points.toLocaleString() },
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
              style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.08)' }}
            >
              <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-0.5">{item.label}</p>
              <p className="font-condensed font-semibold text-[14px] text-[#112535]">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'activity' && (
        <div className="space-y-2">
          {member.recentPosts.length === 0 ? (
            <p className="font-condensed text-[12px] text-[#7a8a96]">No recent posts.</p>
          ) : (
            member.recentPosts.map(post => (
              <div
                key={post.id}
                className="rounded p-4"
                style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.08)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-condensed font-bold text-[10px] text-[#68a2b9]">
                    #{(post.channels as { name: string; slug: string } | null)?.slug ?? 'general'}
                  </span>
                  <span className="font-condensed text-[10px] text-[#7a8a96]">{fmtDatetime(post.created_at)}</span>
                </div>
                <p className="font-body text-[13px] text-[#112535] line-clamp-2">{post.body}</p>
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
                style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.08)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-condensed font-bold text-[10px] text-[#68a2b9] mr-2">P{group.pillarNumber}</span>
                    <span className="font-condensed font-semibold text-[13px] text-[#112535]">{group.courseTitle}</span>
                  </div>
                  <span className="font-condensed font-bold text-[12px] text-[#1b3c5a]">{completed}/{total} ({pct}%)</span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(27,60,90,0.08)' }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#68a2b9' }} />
                </div>
              </div>
            )
          })}
          {Object.keys(progressByCourse).length === 0 && (
            <p className="font-condensed text-[12px] text-[#7a8a96]">No lesson progress recorded.</p>
          )}
        </div>
      )}

      {tab === 'vendasta' && (
        <div>
          {member.vendastaContactId ? (
            <p className="font-condensed text-[12px] text-[#7a8a96] mb-4">
              Contact ID: <span className="text-[#1b3c5a] font-bold">{member.vendastaContactId}</span>
            </p>
          ) : (
            <p className="font-condensed text-[12px] text-[#ef0e30] mb-4">No Vendasta contact linked.</p>
          )}
          {member.vendastaWebhooks.length === 0 ? (
            <p className="font-condensed text-[12px] text-[#7a8a96]">No webhook events found.</p>
          ) : (
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(27,60,90,0.1)', backgroundColor: 'rgba(27,60,90,0.03)' }}>
                    {['Event', 'Order ID', 'SKU', 'Date', 'Status'].map(h => (
                      <th key={h} className="px-4 py-2 text-left font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {member.vendastaWebhooks.map((wh, i, arr) => {
                    const sc = STATUS_COLORS[wh.status] ?? STATUS_COLORS.error
                    return (
                      <tr key={wh.id} style={{ borderBottom: i === arr.length - 1 ? 'none' : '1px solid rgba(27,60,90,0.06)' }}>
                        <td className="px-4 py-2.5">
                          <span className="font-condensed text-[11px] text-[#1b3c5a]">{wh.event_type}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-condensed text-[11px] text-[#7a8a96]">{wh.vendasta_order_id ?? '—'}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-condensed text-[11px] text-[#7a8a96]">{wh.product_sku ?? '—'}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-condensed text-[11px] text-[#7a8a96]">{fmtDatetime(wh.processed_at)}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className="font-condensed font-bold uppercase text-[9px] px-2 py-0.5 rounded"
                            style={{ backgroundColor: sc.bg, color: sc.color }}
                          >
                            {wh.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
