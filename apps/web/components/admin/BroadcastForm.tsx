'use client'

import { useState, useEffect } from 'react'

type Audience = 'all' | 'vip' | 'pro'
type NotifType = 'system_general' | 'event_reminder' | 'course_unlock' | 'system_billing'

const AUDIENCE_OPTIONS: { value: Audience; label: string; desc: string }[] = [
  { value: 'all',       label: 'All Members',     desc: 'Every active + trial member' },
  { value: 'vip',       label: 'VIP Only',         desc: 'VIP tier members' },
  { value: 'pro',       label: 'Pro Only',        desc: 'Pro tier members' },
]

const TYPE_OPTIONS: { value: NotifType; label: string }[] = [
  { value: 'system_general',  label: 'General' },
  { value: 'event_reminder',  label: 'Event Reminder' },
  { value: 'course_unlock',   label: 'Course Unlock' },
  { value: 'system_billing',  label: 'Billing' },
]

const TYPE_META: Record<NotifType, { color: string; bg: string; border: string }> = {
  system_general: { color: '#1b3c5a', bg: 'rgba(27,60,90,0.06)',   border: 'rgba(27,60,90,0.15)' },
  event_reminder: { color: '#c9a84c', bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.25)' },
  course_unlock:  { color: '#ef0e30', bg: 'rgba(239,14,48,0.06)',  border: 'rgba(239,14,48,0.15)' },
  system_billing: { color: '#68a2b9', bg: 'rgba(104,162,185,0.08)',border: 'rgba(104,162,185,0.2)' },
}

export function BroadcastForm() {
  const [title,     setTitle]     = useState('')
  const [message,   setMessage]   = useState('')
  const [audience,  setAudience]  = useState<Audience>('all')
  const [type,      setType]      = useState<NotifType>('system_general')
  const [actionUrl, setActionUrl] = useState('')
  const [sending,   setSending]   = useState(false)
  const [result,    setResult]    = useState<{ sent?: number; error?: string } | null>(null)
  const [audienceCount, setAudienceCount] = useState<number | null>(null)

  // Fetch audience count when selection changes
  useEffect(() => {
    setAudienceCount(null)
    fetch(`/api/admin/broadcast/count?audience=${audience}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { count?: number } | null) => {
        if (d?.count !== undefined) setAudienceCount(d.count)
      })
      .catch(() => {})
  }, [audience])

  async function handleSend() {
    if (!title.trim() || !message.trim()) return
    setSending(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:     title.trim(),
          message:   message.trim(),
          audience,
          type,
          actionUrl: actionUrl.trim() || undefined,
        }),
      })
      const data = await res.json() as { sent?: number; error?: string }
      setResult(data)
      if (res.ok) {
        setTitle('')
        setMessage('')
        setActionUrl('')
      }
    } catch {
      setResult({ error: 'Network error' })
    } finally {
      setSending(false)
    }
  }

  const typeMeta = TYPE_META[type]
  const previewValid = title.trim() && message.trim()

  return (
    <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
      {/* Form */}
      <div
        className="rounded-lg p-6"
        style={{ backgroundColor: 'white', border: '1px solid rgba(27,60,90,0.1)' }}
      >
        {/* Title */}
        <div className="mb-4">
          <label className="block font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-1.5">
            Title <span className="text-[#ef0e30]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={100}
            placeholder="Notification title\u2026"
            className="w-full font-condensed text-[13px] rounded px-3 py-2 outline-none transition-all"
            style={{ border: '1px solid rgba(27,60,90,0.18)', color: '#112535' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
          />
          <p className="font-condensed text-[10px] text-[#7a8a96] mt-0.5 text-right">{title.length}/100</p>
        </div>

        {/* Message */}
        <div className="mb-4">
          <label className="block font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-1.5">
            Message <span className="text-[#ef0e30]">*</span>
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Notification body \u2014 use **bold** for emphasis\u2026"
            className="w-full font-condensed text-[13px] rounded px-3 py-2 outline-none transition-all resize-none"
            style={{ border: '1px solid rgba(27,60,90,0.18)', color: '#112535' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
          />
          <p className="font-condensed text-[10px] text-[#7a8a96] mt-0.5 text-right">{message.length}/500</p>
        </div>

        {/* Audience */}
        <div className="mb-4">
          <label className="block font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-2">
            Audience
          </label>
          <div className="flex flex-col gap-2">
            {AUDIENCE_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="audience"
                  value={opt.value}
                  checked={audience === opt.value}
                  onChange={() => setAudience(opt.value)}
                  className="accent-[#1b3c5a]"
                />
                <div>
                  <span className="font-condensed font-semibold text-[12px] text-[#112535]">{opt.label}</span>
                  <span className="font-condensed text-[11px] text-[#7a8a96] ml-2">{opt.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Type */}
        <div className="mb-4">
          <label className="block font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-1.5">
            Notification Type
          </label>
          <select
            value={type}
            onChange={e => setType(e.target.value as NotifType)}
            className="font-condensed text-[12px] rounded px-2.5 py-2 outline-none"
            style={{ border: '1px solid rgba(27,60,90,0.18)', color: '#112535', backgroundColor: 'white' }}
          >
            {TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Action URL */}
        <div className="mb-6">
          <label className="block font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-1.5">
            Action URL <span className="text-[#7a8a96]">(optional)</span>
          </label>
          <input
            type="text"
            value={actionUrl}
            onChange={e => setActionUrl(e.target.value)}
            placeholder="/events/123 or /academy"
            className="w-full font-condensed text-[13px] rounded px-3 py-2 outline-none transition-all"
            style={{ border: '1px solid rgba(27,60,90,0.18)', color: '#112535' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#68a2b9')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(27,60,90,0.18)')}
          />
        </div>

        {/* Send */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim()}
            className="font-condensed font-bold uppercase tracking-[0.12em] text-[12px] px-6 py-2.5 rounded transition-all disabled:opacity-40"
            style={{ backgroundColor: '#1b3c5a', color: 'white' }}
          >
            {sending ? 'Sending\u2026' : 'Send Broadcast'}
          </button>

          {result?.sent !== undefined && (
            <p className="font-condensed font-semibold text-[12px] text-[#15803d]">
              \u2713 Sent to {result.sent} members
            </p>
          )}
          {result?.error && (
            <p className="font-condensed font-semibold text-[12px] text-[#ef0e30]">{result.error}</p>
          )}
        </div>
      </div>

      {/* Preview */}
      <div>
        <p className="font-condensed font-bold uppercase tracking-[0.16em] text-[9px] text-[#7a8a96] mb-3">
          Live Preview
        </p>
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid rgba(27,60,90,0.1)' }}
        >
          {previewValid ? (
            <div
              className="p-4 border-l-[3px]"
              style={{
                backgroundColor: 'white',
                borderLeftColor: typeMeta.color,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-condensed font-bold uppercase text-[9px] px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: typeMeta.bg, color: typeMeta.color, border: `1px solid ${typeMeta.border}` }}
                    >
                      {TYPE_OPTIONS.find(t => t.value === type)?.label ?? type}
                    </span>
                    <span className="font-condensed font-bold text-[9px] text-[#7a8a96]">just now</span>
                  </div>
                  <p className="font-body font-semibold text-[13px] text-[#112535] mb-0.5">{title}</p>
                  <p className="font-body text-[12px] text-[#7a8a96]">
                    {message.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                      i % 2 === 1 ? <strong key={i} className="text-[#1b3c5a]">{part}</strong> : part,
                    )}
                  </p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: typeMeta.color }} />
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="font-condensed text-[11px] text-[#7a8a96]">Fill in title and message to see preview</p>
            </div>
          )}
        </div>

        <div
          className="rounded mt-4 p-4"
          style={{ backgroundColor: 'rgba(27,60,90,0.04)', border: '1px solid rgba(27,60,90,0.08)' }}
        >
          <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] mb-1">Audience</p>
          <p className="font-condensed text-[12px] text-[#1b3c5a] font-semibold">
            {AUDIENCE_OPTIONS.find(a => a.value === audience)?.label ?? audience}
          </p>
          <p className="font-condensed text-[10px] text-[#7a8a96] mt-0.5">
            {AUDIENCE_OPTIONS.find(a => a.value === audience)?.desc}
            {audienceCount !== null && (
              <span className="font-semibold text-[#1b3c5a]"> \u2014 {audienceCount} member{audienceCount !== 1 ? 's' : ''}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
