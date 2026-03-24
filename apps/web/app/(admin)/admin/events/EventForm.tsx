'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EventFormValues {
  title: string
  description: string
  eventType: 'live' | 'virtual' | 'inperson'
  startsAt: string
  endsAt: string
  zoomUrl: string
  recordingUrl: string
  requiredTier: 'community' | 'pro' | ''
  isPublished: boolean
}

interface EventFormProps {
  initialValues?: Partial<EventFormValues>
  eventId?: string   // if set, we're editing
}

const DEFAULT_VALUES: EventFormValues = {
  title: '',
  description: '',
  eventType: 'virtual',
  startsAt: '',
  endsAt: '',
  zoomUrl: '',
  recordingUrl: '',
  requiredTier: '',
  isPublished: false,
}

function toDatetimeLocal(iso: string): string {
  if (!iso) return ''
  // Trim seconds/ms for datetime-local input
  return iso.slice(0, 16)
}

export function EventForm({ initialValues, eventId }: EventFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<EventFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
    startsAt: toDatetimeLocal(initialValues?.startsAt ?? ''),
    endsAt: toDatetimeLocal(initialValues?.endsAt ?? ''),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      event_type: values.eventType,
      starts_at: values.startsAt ? new Date(values.startsAt).toISOString() : null,
      ends_at: values.endsAt ? new Date(values.endsAt).toISOString() : null,
      zoom_url: values.zoomUrl.trim() || null,
      recording_url: values.recordingUrl.trim() || null,
      required_tier: values.requiredTier || null,
      is_published: values.isPublished,
    }

    try {
      let res: Response
      if (eventId) {
        res = await fetch(`/api/admin/events/${eventId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Save failed')
      }

      router.push('/admin/events')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!eventId) return
    if (!confirm('Delete this event? This cannot be undone.')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Delete failed')
      }
      router.push('/admin/events')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div
          className="rounded px-4 py-3 font-condensed text-[12px]"
          style={{ backgroundColor: 'rgba(239,14,48,0.08)', color: '#ef0e30', border: '1px solid rgba(239,14,48,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
          Title *
        </label>
        <input
          type="text"
          value={values.title}
          onChange={e => set('title', e.target.value)}
          required
          maxLength={200}
          className="w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none transition-all"
          style={{ border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }}
          placeholder="Event title"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
          Description
        </label>
        <textarea
          value={values.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
          className="w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none transition-all resize-none"
          style={{ border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }}
          placeholder="What is this event about?"
        />
      </div>

      {/* Event type */}
      <div>
        <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
          Event Type *
        </label>
        <div className="flex gap-2">
          {(['live', 'virtual', 'inperson'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => set('eventType', type)}
              className="font-condensed font-semibold uppercase text-[11px] rounded px-4 py-2 transition-all capitalize"
              style={{
                backgroundColor: values.eventType === type ? '#1b3c5a' : 'transparent',
                color: values.eventType === type ? 'white' : '#1b3c5a',
                border: '1px solid rgba(27,60,90,0.2)',
              }}
            >
              {type === 'inperson' ? 'In Person' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
            Start Date & Time *
          </label>
          <input
            type="datetime-local"
            value={values.startsAt}
            onChange={e => set('startsAt', e.target.value)}
            required
            className="w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none"
            style={{ border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }}
          />
        </div>
        <div>
          <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
            End Date & Time
          </label>
          <input
            type="datetime-local"
            value={values.endsAt}
            onChange={e => set('endsAt', e.target.value)}
            className="w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none"
            style={{ border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }}
          />
        </div>
      </div>

      {/* Zoom URL */}
      <div>
        <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
          Zoom / Meeting URL
        </label>
        <input
          type="url"
          value={values.zoomUrl}
          onChange={e => set('zoomUrl', e.target.value)}
          className="w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none"
          style={{ border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }}
          placeholder="https://zoom.us/j/..."
        />
        <p className="font-condensed text-[10px] text-[#7a8a96] mt-1">Only shown to registered members</p>
      </div>

      {/* Recording URL */}
      <div>
        <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
          Recording URL
        </label>
        <input
          type="url"
          value={values.recordingUrl}
          onChange={e => set('recordingUrl', e.target.value)}
          className="w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none"
          style={{ border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }}
          placeholder="https://..."
        />
      </div>

      {/* Required tier */}
      <div>
        <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
          Required Tier
        </label>
        <div className="flex gap-2">
          {([['', 'Any Tier'], ['community', 'Community'], ['pro', 'Pro']] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => set('requiredTier', val)}
              className="font-condensed font-semibold uppercase text-[11px] rounded px-4 py-2 transition-all"
              style={{
                backgroundColor: values.requiredTier === val ? '#1b3c5a' : 'transparent',
                color: values.requiredTier === val ? 'white' : '#1b3c5a',
                border: '1px solid rgba(27,60,90,0.2)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Published */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set('isPublished', !values.isPublished)}
          className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
          style={{ backgroundColor: values.isPublished ? '#68a2b9' : 'rgba(27,60,90,0.15)' }}
        >
          <span
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
            style={{ transform: values.isPublished ? 'translateX(22px)' : 'translateX(2px)' }}
          />
        </button>
        <span className="font-condensed font-semibold text-[12px] text-[#1b3c5a]">
          {values.isPublished ? 'Published (visible to members)' : 'Draft (hidden from members)'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(27,60,90,0.08)' }}>
        <div>
          {eventId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="font-condensed font-semibold uppercase tracking-wide text-[11px] transition-colors"
              style={{ color: '#ef0e30' }}
            >
              Delete Event
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/events"
            className="font-condensed font-semibold uppercase tracking-wide text-[11px] text-[#7a8a96] hover:text-[#1b3c5a] transition-colors"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={saving}
            className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-6 py-2.5 transition-all"
            style={{ backgroundColor: '#1b3c5a', color: 'white', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving...' : eventId ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </div>
    </form>
  )
}
