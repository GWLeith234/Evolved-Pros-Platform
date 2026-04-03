'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EventImageGenerator } from '@/components/admin/EventImageGenerator'

interface EventFormValues {
  title: string
  description: string
  eventType: 'live' | 'virtual' | 'inperson'
  startsAt: string
  endsAt: string
  zoomUrl: string
  recordingUrl: string
  imageUrl: string
  requiredTier: 'community' | 'pro' | ''
  tierAccess: 'all' | 'vip' | 'pro'
  isPublished: boolean
}

interface EventFormProps {
  initialValues?: Partial<EventFormValues>
  eventId?: string
}

const DEFAULT_VALUES: EventFormValues = {
  title: '',
  description: '',
  eventType: 'virtual',
  startsAt: '',
  endsAt: '',
  zoomUrl: '',
  recordingUrl: '',
  imageUrl: '',
  requiredTier: '',
  tierAccess: 'all',
  isPublished: false,
}

function toDatetimeLocal(iso: string): string {
  if (!iso) return ''
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
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(file: File) {
    const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
    if (!ACCEPTED.includes(file.type)) {
      setUploadError('Please upload a JPEG, PNG, or WebP image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5MB')
      return
    }
    setUploadError(null)
    setUploadState('uploading')
    try {
      const supabase = createClient()
      const path = `events/${Date.now()}-${file.name}`
      const { data: upload, error: uploadErr } = await supabase.storage
        .from('Branding')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (uploadErr || !upload) throw new Error(uploadErr?.message ?? 'Upload failed')
      const { data: { publicUrl } } = supabase.storage.from('Branding').getPublicUrl(upload.path)
      set('imageUrl', publicUrl)
      setUploadState('idle')
    } catch {
      setUploadState('error')
      setUploadError('Upload failed — try again')
    }
  }

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  async function save(asDraft: boolean) {
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
      image_url: values.imageUrl.trim() || null,
      required_tier: values.requiredTier || null,
      tier_access: values.tierAccess,
      is_published: !asDraft,
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

  const inputStyle = { border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }
  const labelClass = 'block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5'
  const inputClass = 'w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none transition-all'

  return (
    <div className="space-y-6 max-w-2xl">
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
        <label className={labelClass}>Title *</label>
        <input
          type="text"
          value={values.title}
          onChange={e => set('title', e.target.value)}
          maxLength={200}
          className={inputClass}
          style={inputStyle}
          placeholder="Event title"
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={values.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
          className={`${inputClass} resize-none`}
          style={inputStyle}
          placeholder="What is this event about?"
        />
      </div>

      {/* Event type */}
      <div>
        <label className={labelClass}>Event Type *</label>
        <div className="flex gap-2">
          {(['live', 'virtual', 'inperson'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => set('eventType', type)}
              className="font-condensed font-semibold uppercase text-[11px] rounded px-4 py-2 transition-all"
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
          <label className={labelClass}>Start Date & Time *</label>
          <input
            type="datetime-local"
            value={values.startsAt}
            onChange={e => set('startsAt', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelClass}>End Date & Time</label>
          <input
            type="datetime-local"
            value={values.endsAt}
            onChange={e => set('endsAt', e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Zoom URL */}
      <div>
        <label className={labelClass}>Zoom / Meeting URL</label>
        <input
          type="url"
          value={values.zoomUrl}
          onChange={e => set('zoomUrl', e.target.value)}
          className={inputClass}
          style={inputStyle}
          placeholder="https://zoom.us/j/..."
        />
        <p className="font-condensed text-[10px] text-[#7a8a96] mt-1">Only shown to registered members</p>
      </div>

      {/* Recording URL */}
      <div>
        <label className={labelClass}>Recording URL</label>
        <input
          type="url"
          value={values.recordingUrl}
          onChange={e => set('recordingUrl', e.target.value)}
          className={inputClass}
          style={inputStyle}
          placeholder="https://..."
        />
      </div>

      {/* Cover Image Upload + AI Generator */}
      <div>
        <label className={labelClass}>Cover Image</label>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]) }}
        />

        {values.imageUrl ? (
          /* Preview with Replace / Remove */
          <div className="flex items-center gap-4 mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={values.imageUrl}
              alt=""
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(27,60,90,0.15)', flexShrink: 0 }}
            />
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadState === 'uploading'}
                className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2 transition-all"
                style={{ border: '1px solid rgba(27,60,90,0.2)', color: '#1b3c5a', backgroundColor: 'transparent' }}
              >
                {uploadState === 'uploading' ? 'Uploading…' : 'Replace'}
              </button>
              <button
                type="button"
                onClick={() => { set('imageUrl', ''); setUploadError(null) }}
                className="font-condensed text-[10px] text-left"
                style={{ color: '#ef0e30', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          /* Drop zone */
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadState === 'uploading'}
            className="w-full mb-3 transition-colors"
            style={{
              border: '2px dashed rgba(27,60,90,0.2)',
              borderRadius: 8,
              padding: '32px 20px',
              backgroundColor: 'transparent',
              cursor: uploadState === 'uploading' ? 'default' : 'pointer',
              textAlign: 'center',
            }}
          >
            {uploadState === 'uploading' ? (
              <p className="font-condensed font-semibold text-[13px]" style={{ color: '#7a8a96' }}>Uploading…</p>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(122,138,150,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 8px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p className="font-condensed font-semibold text-[13px] mb-1" style={{ color: '#7a8a96' }}>
                  Click to upload or drag &amp; drop
                </p>
                <p className="font-condensed text-[11px]" style={{ color: 'rgba(122,138,150,0.55)' }}>
                  JPEG, PNG, WebP · max 5 MB
                </p>
              </>
            )}
          </button>
        )}

        {uploadError && (
          <p className="font-condensed text-[11px] mb-3" style={{ color: '#ef0e30' }}>{uploadError}</p>
        )}

        <EventImageGenerator
          eventTitle={values.title}
          onSelect={url => set('imageUrl', url)}
        />
      </div>

      {/* Tier Access */}
      <div>
        <label className={labelClass}>Tier Access</label>
        <div className="flex gap-2">
          {([['all', 'All Members'], ['vip', 'VIP Only'], ['pro', 'Pro Only']] as const).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => set('tierAccess', val)}
              className="font-condensed font-semibold uppercase text-[11px] rounded px-4 py-2 transition-all"
              style={{
                backgroundColor: values.tierAccess === val ? '#1b3c5a' : 'transparent',
                color: values.tierAccess === val ? 'white' : '#1b3c5a',
                border: '1px solid rgba(27,60,90,0.2)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Required Tier (legacy) */}
      <div>
        <label className={labelClass}>Required Tier (legacy)</label>
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

      {/* Actions footer */}
      <div
        className="flex items-center justify-between pt-4"
        style={{ borderTop: '1px solid rgba(27,60,90,0.08)' }}
      >
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

          {/* Save Draft */}
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving || !values.title.trim() || !values.startsAt}
            className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-5 py-2.5 transition-all"
            style={{
              backgroundColor: 'transparent',
              color: '#1b3c5a',
              border: '1px solid rgba(27,60,90,0.25)',
              opacity: saving || !values.title.trim() || !values.startsAt ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>

          {/* Publish */}
          <button
            type="button"
            onClick={() => save(false)}
            disabled={saving || !values.title.trim() || !values.startsAt}
            className="font-condensed font-bold uppercase tracking-wide text-[12px] rounded px-6 py-2.5 transition-all"
            style={{
              backgroundColor: '#ef0e30',
              color: 'white',
              opacity: saving || !values.title.trim() || !values.startsAt ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving…' : eventId ? 'Publish Changes' : 'Publish Event'}
          </button>
        </div>
      </div>
    </div>
  )
}
