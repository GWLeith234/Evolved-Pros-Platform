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
  guestImageUrl: string
  muxPlaybackId: string
  youtubeUrl: string
  thumbnailUrl: string
  durationSeconds: string
  transcript: string
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
  guestImageUrl: '',
  muxPlaybackId: '',
  youtubeUrl: '',
  thumbnailUrl: '',
  durationSeconds: '',
  transcript: '',
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
  const [toast, setToast] = useState('')

  // Guest photo upload state
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  // Transcript generation state
  const [audioUrl, setAudioUrl] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const [transcribeError, setTranscribeError] = useState<string | null>(null)
  const [transcribeSuccess, setTranscribeSuccess] = useState(false)

  function set<K extends keyof EpisodeFormValues>(key: K, value: EpisodeFormValues[K]) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  function handleTitleChange(title: string) {
    setValues(prev => ({
      ...prev,
      title,
      slug: prev.slug === slugify(prev.title) || prev.slug === '' ? slugify(title) : prev.slug,
    }))
  }

  async function handlePhotoUpload(file: File) {
    setPhotoUploading(true)
    setPhotoError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (episodeId) formData.append('episodeId', episodeId)
      const res = await fetch('/api/admin/upload-guest-photo', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      set('guestImageUrl', data.url)
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setPhotoUploading(false)
    }
  }

  async function handleGenerateTranscript() {
    if (!episodeId) {
      setTranscribeError('Save the episode first before generating a transcript.')
      return
    }
    if (!audioUrl.trim()) {
      setTranscribeError('Enter an audio URL to generate a transcript.')
      return
    }

    setTranscribing(true)
    setTranscribeError(null)
    setTranscribeSuccess(false)

    try {
      const res = await fetch('/api/admin/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId, audioUrl: audioUrl.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Transcription failed')

      set('transcript', data.transcript ?? '')
      setTranscribeSuccess(true)
    } catch (e) {
      setTranscribeError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setTranscribing(false)
    }
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
      guest_image_url: values.guestImageUrl.trim() || null,
      mux_playback_id: values.muxPlaybackId.trim() || null,
      youtube_url: values.youtubeUrl.trim() || null,
      thumbnail_url: values.thumbnailUrl.trim() || null,
      duration_seconds: values.durationSeconds ? parseInt(values.durationSeconds, 10) : null,
      transcript: values.transcript.trim() || null,
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

      if (episodeId) {
        // Edit flow: brief toast then redirect
        setToast('Episode saved')
        setTimeout(() => router.push('/admin/episodes'), 1200)
      } else {
        // Create flow: redirect immediately — button stays disabled through navigation
        router.push('/admin/episodes')
      }
      // Do NOT setSaving(false) on success — keeps button disabled until page navigates away
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
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
      {/* Fixed-position save toast — unmissable, auto-dismissed with the redirect */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#22c55e',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ✓ {toast}
        </div>
      )}

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

          {/* Guest Photo upload */}
          <LabelledInput
            label="Guest Photo"
            hint="Recommended: square crop, min 400×400px. Displays as bleed on episode cards."
          >
            <div
              className="rounded-lg p-4"
              style={{ backgroundColor: '#f5f7f9', border: '1px solid rgba(27,60,90,0.1)' }}
            >
              {/* Preview */}
              {values.guestImageUrl && (
                <div className="flex items-start gap-4 mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={values.guestImageUrl}
                    alt="Guest photo"
                    className="w-20 h-20 rounded-lg object-cover object-top flex-shrink-0"
                    style={{ border: '1px solid rgba(27,60,90,0.15)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-condensed text-[10px] text-[#7a8a96] mb-2 truncate">{values.guestImageUrl}</p>
                    <label
                      className="font-condensed font-bold uppercase tracking-wide text-[10px] rounded px-3 py-1.5 cursor-pointer transition-all inline-block"
                      style={{ backgroundColor: 'transparent', color: '#1b3c5a', border: '1px solid rgba(27,60,90,0.2)' }}
                    >
                      Replace
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={photoUploading}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Upload zone (when no photo yet) */}
              {!values.guestImageUrl && (
                <label
                  className="flex flex-col items-center justify-center gap-2 rounded-lg cursor-pointer transition-all"
                  style={{
                    border: '2px dashed rgba(27,60,90,0.2)',
                    padding: '24px 16px',
                    backgroundColor: photoUploading ? 'rgba(27,60,90,0.03)' : 'white',
                  }}
                >
                  {photoUploading ? (
                    <span className="font-condensed text-[12px]" style={{ color: '#7a8a96' }}>Uploading…</span>
                  ) : (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(27,60,90,0.3)" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span className="font-condensed font-semibold text-[11px]" style={{ color: '#7a8a96' }}>
                        Click to upload guest photo
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={photoUploading}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f) }}
                  />
                </label>
              )}

              {photoError && (
                <p className="font-condensed text-[11px] mt-2" style={{ color: '#ef0e30' }}>{photoError}</p>
              )}
            </div>
          </LabelledInput>
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

      {/* Transcript */}
      <div
        className="rounded-lg p-5 space-y-4"
        style={{ backgroundColor: '#f5f7f9', border: '1px solid rgba(27,60,90,0.1)' }}
      >
        <div>
          <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-0.5">
            Transcript
          </p>
          <p className="font-condensed text-[10px] text-[#7a8a96]">
            Paste a transcript manually, or generate one from an audio file using Whisper.
          </p>
        </div>

        {/* Audio URL + Generate button */}
        <div>
          <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
            Audio URL (MP3 / M4A)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={audioUrl}
              onChange={e => { setAudioUrl(e.target.value); setTranscribeError(null); setTranscribeSuccess(false) }}
              className={`flex-1 rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none transition-all`}
              style={inputStyle}
              placeholder="https://... direct link to audio file"
              disabled={transcribing}
            />
            <button
              type="button"
              onClick={handleGenerateTranscript}
              disabled={transcribing || !audioUrl.trim()}
              className="flex-shrink-0 font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2.5 transition-all whitespace-nowrap"
              style={{
                backgroundColor: transcribing ? 'rgba(27,60,90,0.4)' : '#1b3c5a',
                color: 'white',
                opacity: !audioUrl.trim() ? 0.4 : 1,
                cursor: transcribing || !audioUrl.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {transcribing ? 'Generating…' : 'Generate Transcript'}
            </button>
          </div>

          {/* Status messages */}
          {transcribing && (
            <div className="flex items-center gap-2 mt-2">
              <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#68a2b9" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <span className="font-condensed text-[11px]" style={{ color: '#68a2b9' }}>
                Processing audio with Whisper — this may take 1–3 minutes for long episodes…
              </span>
            </div>
          )}
          {transcribeSuccess && !transcribing && (
            <p className="font-condensed text-[11px] mt-2" style={{ color: '#4caf50' }}>
              ✓ Transcript generated and saved successfully.
            </p>
          )}
          {transcribeError && (
            <p className="font-condensed text-[11px] mt-2" style={{ color: '#ef0e30' }}>
              {transcribeError}
            </p>
          )}
        </div>

        {/* Transcript textarea */}
        <LabelledInput label="Transcript Text" hint="Auto-populated after generation, or paste manually.">
          <textarea
            value={values.transcript}
            onChange={e => set('transcript', e.target.value)}
            rows={10}
            className={`${inputClass} resize-y`}
            style={{ ...inputStyle, fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6' }}
            placeholder="Transcript will appear here after generation…"
          />
        </LabelledInput>
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
