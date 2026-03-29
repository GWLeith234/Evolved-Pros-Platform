'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EpisodeFormValues {
  title: string
  slug: string
  episodeNumber: string
  season: string
  description: string
  guestName: string
  guestTitle: string
  guestCompany: string
  muxPlaybackId: string
  youtubeUrl: string
  thumbnailUrl: string
  durationSeconds: string
  isPublished: boolean
}

interface EpisodeFormProps {
  initialValues?: Partial<EpisodeFormValues>
  episodeId?: string
}

const DEFAULT_VALUES: EpisodeFormValues = {
  title: '',
  slug: '',
  episodeNumber: '',
  season: '1',
  description: '',
  guestName: '',
  guestTitle: '',
  guestCompany: '',
  muxPlaybackId: '',
  youtubeUrl: '',
  thumbnailUrl: '',
  durationSeconds: '',
  isPublished: false,
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function LabelledInput({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="font-condensed text-[10px] text-[#7a8a96] mt-1">{hint}</p>}
    </div>
  )
}

const inputClass = 'w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none transition-all'
const inputStyle = { border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }

export function EpisodeForm({ initialValues, episodeId }: EpisodeFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<EpisodeFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof EpisodeFormValues>(key: K, value: EpisodeFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  function handleTitleChange(title: string) {
    setValues(prev => ({
      ...prev,
      title,
      // Auto-fill slug only if user hasn't manually edited it
      slug: prev.slug === slugify(prev.title) || prev.slug === '' ? slugify(title) : prev.slug,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      title: values.title.trim(),
      slug: values.slug.trim() || slugify(values.title.trim()),
      episode_number: values.episodeNumber ? parseInt(values.episodeNumber, 10) : null,
      season: values.season ? parseInt(values.season, 10) : 1,
      description: values.description.trim() || null,
      guest_name: values.guestName.trim() || null,
      guest_title: values.guestTitle.trim() || null,
      guest_company: values.guestCompany.trim() || null,
      mux_playback_id: values.muxPlaybackId.trim() || null,
      youtube_url: values.youtubeUrl.trim() || null,
      thumbnail_url: values.thumbnailUrl.trim() || null,
      duration_seconds: values.durationSeconds ? parseInt(values.durationSeconds, 10) : null,
      is_published: values.isPublished,
    }

    try {
      let res: Response
      if (episodeId) {
        res = await fetch(`/api/admin/episodes/${episodeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/episodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Save failed')
      }

      router.push('/admin/episodes')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!episodeId) return
    if (!confirm('Delete this episode? This cannot be undone.')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/episodes/${episodeId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Delete failed')
      }
      router.push('/admin/episodes')
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
      <LabelledInput label="Title *">
        <input
          type="text"
          value={values.title}
          onChange={e => handleTitleChange(e.target.value)}
          required
          maxLength={300}
          className={inputClass}
          style={inputStyle}
          placeholder="Episode title"
        />
      </LabelledInput>

      {/* Slug */}
      <LabelledInput label="Slug" hint="Auto-generated from title. Used in the URL.">
        <input
          type="text"
          value={values.slug}
          onChange={e => set('slug', e.target.value)}
          maxLength={300}
          className={inputClass}
          style={inputStyle}
          placeholder="episode-slug"
        />
      </LabelledInput>

      {/* Episode number + Season */}
      <div className="grid grid-cols-2 gap-4">
        <LabelledInput label="Episode Number">
          <input
            type="number"
            value={values.episodeNumber}
            onChange={e => set('episodeNumber', e.target.value)}
            min={1}
            className={inputClass}
            style={inputStyle}
            placeholder="e.g. 42"
          />
        </LabelledInput>
        <LabelledInput label="Season">
          <input
            type="number"
            value={values.season}
            onChange={e => set('season', e.target.value)}
            min={1}
            className={inputClass}
            style={inputStyle}
            placeholder="1"
          />
        </LabelledInput>
      </div>

      {/* Description */}
      <LabelledInput label="Description">
        <textarea
          value={values.description}
          onChange={e => set('description', e.target.value)}
          rows={4}
          className={`${inputClass} resize-none`}
          style={inputStyle}
          placeholder="What is this episode about?"
        />
      </LabelledInput>

      {/* Guest info */}
      <div>
        <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-3">
          Guest Info
        </p>
        <div className="space-y-4">
          <LabelledInput label="Guest Name">
            <input
              type="text"
              value={values.guestName}
              onChange={e => set('guestName', e.target.value)}
              maxLength={200}
              className={inputClass}
              style={inputStyle}
              placeholder="e.g. Dennis Yu"
            />
          </LabelledInput>
          <div className="grid grid-cols-2 gap-4">
            <LabelledInput label="Guest Title">
              <input
                type="text"
                value={values.guestTitle}
                onChange={e => set('guestTitle', e.target.value)}
                maxLength={200}
                className={inputClass}
                style={inputStyle}
                placeholder="e.g. CEO"
              />
            </LabelledInput>
            <LabelledInput label="Guest Company">
              <input
                type="text"
                value={values.guestCompany}
                onChange={e => set('guestCompany', e.target.value)}
                maxLength={200}
                className={inputClass}
                style={inputStyle}
                placeholder="e.g. BlitzMetrics"
              />
            </LabelledInput>
          </div>
        </div>
      </div>

      {/* Media */}
      <div>
        <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-3">
          Media
        </p>
        <div className="space-y-4">
          <LabelledInput label="Mux Playback ID" hint="The playback ID from Mux (not the full URL)">
            <input
              type="text"
              value={values.muxPlaybackId}
              onChange={e => set('muxPlaybackId', e.target.value)}
              maxLength={200}
              className={inputClass}
              style={inputStyle}
              placeholder="e.g. abc123xyz"
            />
          </LabelledInput>
          <LabelledInput label="YouTube URL">
            <input
              type="url"
              value={values.youtubeUrl}
              onChange={e => set('youtubeUrl', e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="https://youtube.com/watch?v=..."
            />
          </LabelledInput>
          <LabelledInput label="Thumbnail URL">
            <input
              type="url"
              value={values.thumbnailUrl}
              onChange={e => set('thumbnailUrl', e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="https://..."
            />
          </LabelledInput>
          <LabelledInput label="Duration (seconds)">
            <input
              type="number"
              value={values.durationSeconds}
              onChange={e => set('durationSeconds', e.target.value)}
              min={0}
              className={inputClass}
              style={inputStyle}
              placeholder="e.g. 3600 for 1 hour"
            />
          </LabelledInput>
        </div>
      </div>

      {/* Published toggle */}
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
          {episodeId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="font-condensed font-semibold uppercase tracking-wide text-[11px] transition-colors"
              style={{ color: '#ef0e30' }}
            >
              Delete Episode
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/episodes"
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
            {saving ? 'Saving...' : episodeId ? 'Save Changes' : 'Create Episode'}
          </button>
        </div>
      </div>
    </form>
  )
}
