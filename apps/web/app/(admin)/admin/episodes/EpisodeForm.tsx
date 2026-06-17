'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImagePicker } from '@/components/admin/ImagePicker'

export type Pillar =
  | 'foundation'
  | 'identity'
  | 'mental-toughness'
  | 'strategy'
  | 'accountability'
  | 'execution'

const PILLAR_OPTIONS: { value: Pillar; label: string }[] = [
  { value: 'foundation', label: 'Foundation' },
  { value: 'identity', label: 'Identity' },
  { value: 'mental-toughness', label: 'Mental Toughness' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'accountability', label: 'Accountability' },
  { value: 'execution', label: 'Execution' },
]

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
  audioUrl: string
  thumbnailUrl: string
  duration: string
  transcript: string
  showNotes: string
  pillar: Pillar | ''
  transistorEpisodeId: string
  isMembersOnly: boolean
  isPublished: boolean
  pinned: boolean
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
  audioUrl: '',
  thumbnailUrl: '',
  duration: '',
  transcript: '',
  showNotes: '',
  pillar: '',
  transistorEpisodeId: '',
  isMembersOnly: false,
  isPublished: false,
  pinned: false,
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Runtime is entered as mm:ss (or h:mm:ss) and stored as duration_seconds.
function durationToSeconds(value: string): number | null {
  const t = value.trim()
  if (!t) return null
  if (!t.includes(':')) {
    const n = parseInt(t, 10)
    return Number.isFinite(n) && n >= 0 ? n : null
  }
  const parts = t.split(':').map(p => parseInt(p, 10))
  if (parts.some(n => !Number.isFinite(n) || n < 0)) return null
  return parts.reduce((acc, p) => acc * 60 + p, 0)
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

  // Transcript generation state (separate from the saved audio_url field —
  // this is the source file fed to Whisper).
  const [transcribeAudioUrl, setTranscribeAudioUrl] = useState('')
  const [transcribing, setTranscribing] = useState(false)
  const [transcribeError, setTranscribeError] = useState<string | null>(null)
  const [transcribeSuccess, setTranscribeSuccess] = useState(false)

  // AI writer state
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiImagePrompt, setAiImagePrompt] = useState<string | null>(null)

  // Album-cover generation state
  const [coverLoading, setCoverLoading] = useState(false)
  const [coverError, setCoverError] = useState<string | null>(null)

  async function handleGenerateCover() {
    setCoverError(null)
    if (!values.guestImageUrl.trim()) {
      setCoverError('Upload a guest photo first.')
      return
    }
    if (!values.guestName.trim()) {
      setCoverError('Enter a guest name first.')
      return
    }
    if (!values.pillar) {
      setCoverError('Pick a pillar first.')
      return
    }
    setCoverLoading(true)
    try {
      const durationSec = durationToSeconds(values.duration)
      const runtime = durationSec && durationSec > 0 ? Math.round(durationSec / 60) : undefined
      const res = await fetch('/api/admin/episodes/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeNumber: values.episodeNumber || undefined,
          guestName: values.guestName.trim(),
          guestTitle: values.guestTitle.trim() || undefined,
          runtime,
          pillar: values.pillar,
          photoUrl: values.guestImageUrl.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not generate cover')
      if (!data.url) throw new Error('No cover URL returned')
      set('thumbnailUrl', data.url)
    } catch (e) {
      setCoverError(e instanceof Error ? e.message : 'Could not generate cover')
    } finally {
      setCoverLoading(false)
    }
  }

  async function handleAIWrite() {
    const titleVal = values.title.trim()
    const guestVal = values.guestName.trim()
    if (!titleVal || !guestVal) {
      setAiError('Enter a title and guest name first.')
      return
    }
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/admin/ai/write-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleVal,
          guest_name: guestVal,
          guest_title: values.guestTitle.trim() || undefined,
          guest_company: values.guestCompany.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not generate')
      const ep = data.episode

      // Map AI's 'mental' → form's 'mental-toughness'.
      const aiPillar = ep.pillar === 'mental' ? 'mental-toughness' : ep.pillar
      const validPillars: Pillar[] = [
        'foundation', 'identity', 'mental-toughness', 'strategy', 'accountability', 'execution',
      ]
      const pillarTag = validPillars.includes(aiPillar as Pillar) ? (aiPillar as Pillar) : null

      // Stitch show_notes + key_takeaways into the existing showNotes field.
      const merged = ep.key_takeaways
        ? `${ep.show_notes ?? ''}\n\n## Key Takeaways\n${ep.key_takeaways}`.trim()
        : (ep.show_notes ?? '')

      setValues(prev => ({
        ...prev,
        description: ep.description ?? prev.description,
        showNotes: merged || prev.showNotes,
        pillar: pillarTag ?? prev.pillar,
      }))
      setAiImagePrompt(ep.image_prompt ?? null)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Could not generate — try again')
    } finally {
      setAiLoading(false)
    }
  }

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
      // Slug drives the canonical path Branding/episodes/guest-{slug}.jpg.
      const slug = values.slug.trim() || slugify(values.title.trim())
      if (slug) formData.append('slug', slug)
      const res = await fetch('/api/admin/upload-guest-photo', {
        method: 'POST',
        body: formData,
        redirect: 'follow',
      })
      let data: { url?: string; error?: string }
      try {
        const text = await res.text()
        data = JSON.parse(text)
      } catch {
        throw new Error(`Upload failed — server returned status ${res.status}. Try refreshing the page.`)
      }
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      if (!data.url) throw new Error('No URL returned from upload')
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
    if (!transcribeAudioUrl.trim()) {
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
        body: JSON.stringify({ episodeId, audioUrl: transcribeAudioUrl.trim() }),
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
      audio_url: values.audioUrl.trim() || null,
      thumbnail_url: values.thumbnailUrl.trim() || null,
      duration_seconds: durationToSeconds(values.duration),
      transcript: values.transcript.trim() || null,
      show_notes: values.showNotes.trim() || null,
      pillar: values.pillar || null,
      transistor_episode_id: values.transistorEpisodeId.trim() || null,
      is_members_only: values.isMembersOnly,
      is_published: values.isPublished,
      pinned: values.pinned,
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
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={handleAIWrite}
            disabled={aiLoading}
            className="font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-3 py-1.5 transition-all disabled:opacity-50"
            style={{ border: '1px solid #0ABFA3', color: '#0ABFA3', backgroundColor: 'transparent' }}
          >
            {aiLoading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#0ABFA3' }} />
                Writing…
              </span>
            ) : 'Write with AI'}
          </button>
          {aiError && (
            <span className="font-condensed text-[11px]" style={{ color: '#ef0e30' }}>{aiError}</span>
          )}
        </div>
        {aiImagePrompt && (
          <div
            className="rounded-lg p-3 mt-3"
            style={{ backgroundColor: 'rgba(10,191,163,0.06)', border: '1px solid rgba(10,191,163,0.2)' }}
          >
            <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] mb-1" style={{ color: '#0ABFA3' }}>
              AI image prompt
            </p>
            <p className="font-body text-[12px] leading-relaxed" style={{ color: '#1b3c5a' }}>
              {aiImagePrompt}
            </p>
            <p className="font-condensed text-[10px] mt-1" style={{ color: '#7a8a96' }}>
              Use this prompt in the image generator below.
            </p>
          </div>
        )}
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
        <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1">
          Media
        </p>
        <p className="font-condensed text-[11px] text-[#7a8a96] mb-3 leading-relaxed">
          Provide a Mux Playback ID for native player playback, or a YouTube URL for YouTube-hosted episodes. Either is fine — both fields are optional, and an episode can be published with only one (or, for audio-only episodes, neither).
        </p>
        <div className="space-y-4">
          <LabelledInput
            label="Mux Playback ID"
            hint="Optional — the playback ID from Mux (not the full URL). Leave blank for YouTube-hosted episodes."
          >
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
          <LabelledInput
            label="YouTube URL"
            hint="Optional — set this for YouTube-hosted episodes when there's no Mux upload."
          >
            <input
              type="url"
              value={values.youtubeUrl}
              onChange={e => set('youtubeUrl', e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="https://youtube.com/watch?v=..."
            />
          </LabelledInput>
          <LabelledInput
            label="Audio URL"
            hint="Optional — direct link to the published audio file (MP3 / M4A) for audio-only playback."
          >
            <input
              type="url"
              value={values.audioUrl}
              onChange={e => set('audioUrl', e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="https://... direct link to audio file"
            />
          </LabelledInput>
          <ImagePicker
            label="Episode Thumbnail"
            value={values.thumbnailUrl || null}
            onChange={url => set('thumbnailUrl', url)}
          />

          {/* Auto album cover — renders branded 2:3 key art from the guest photo */}
          <div
            className="rounded-lg p-4"
            style={{ backgroundColor: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.25)' }}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-condensed font-bold uppercase tracking-[0.18em] text-[9px] mb-0.5" style={{ color: '#9a7d2e' }}>
                  Auto Album Cover
                </p>
                <p className="font-condensed text-[10px]" style={{ color: '#7a8a96' }}>
                  Generates branded key art from the guest photo + pillar, and sets it as the thumbnail above.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateCover}
                disabled={coverLoading}
                className="flex-shrink-0 font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2 transition-all disabled:opacity-50"
                style={{ border: '1px solid #C9A84C', color: '#9a7d2e', backgroundColor: 'transparent' }}
              >
                {coverLoading ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#C9A84C' }} />
                    Rendering…
                  </span>
                ) : 'Generate Cover'}
              </button>
            </div>
            {coverError && (
              <p className="font-condensed text-[11px] mt-2" style={{ color: '#ef0e30' }}>{coverError}</p>
            )}
          </div>
          <LabelledInput
            label="Duration (mm:ss)"
            hint="Enter runtime as mm:ss (or h:mm:ss). Saved as duration_seconds."
          >
            <input
              type="text"
              inputMode="numeric"
              value={values.duration}
              onChange={e => set('duration', e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="e.g. 42:15"
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
              value={transcribeAudioUrl}
              onChange={e => { setTranscribeAudioUrl(e.target.value); setTranscribeError(null); setTranscribeSuccess(false) }}
              className={`flex-1 rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none transition-all`}
              style={inputStyle}
              placeholder="https://... direct link to audio file"
              disabled={transcribing}
            />
            <button
              type="button"
              onClick={handleGenerateTranscript}
              disabled={transcribing || !transcribeAudioUrl.trim()}
              className="flex-shrink-0 font-condensed font-bold uppercase tracking-wide text-[11px] rounded px-4 py-2.5 transition-all whitespace-nowrap"
              style={{
                backgroundColor: transcribing ? 'rgba(27,60,90,0.4)' : '#1b3c5a',
                color: 'white',
                opacity: !transcribeAudioUrl.trim() ? 0.4 : 1,
                cursor: transcribing || !transcribeAudioUrl.trim() ? 'not-allowed' : 'pointer',
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

      {/* Show notes */}
      <LabelledInput label="Show notes" hint="Markdown supported. Distinct from description (short summary) and transcript (full text).">
        <textarea
          value={values.showNotes}
          onChange={e => set('showNotes', e.target.value)}
          className={`${inputClass} resize-y`}
          style={{ ...inputStyle, minHeight: '200px' }}
          placeholder="Episode show notes — links, timestamps, key takeaways…"
        />
      </LabelledInput>

      {/* Pillar */}
      <LabelledInput label="Pillar" hint="The EVOLVED pillar this episode maps to. Shown on the public /podcast page.">
        <select
          value={values.pillar}
          onChange={e => set('pillar', e.target.value as Pillar | '')}
          className={inputClass}
          style={inputStyle}
        >
          <option value="">— Select a pillar —</option>
          {PILLAR_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </LabelledInput>

      {/* Transistor episode ID */}
      <LabelledInput
        label="Transistor episode ID"
        hint="Paste from Transistor's episode URL after publishing there. Leave blank if not yet published on Transistor."
      >
        <input
          type="text"
          value={values.transistorEpisodeId}
          onChange={e => set('transistorEpisodeId', e.target.value)}
          maxLength={100}
          className={inputClass}
          style={inputStyle}
          placeholder="e.g. 1234567"
        />
      </LabelledInput>

      {/* Members-only toggle */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => set('isMembersOnly', !values.isMembersOnly)}
          className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5"
          style={{ backgroundColor: values.isMembersOnly ? '#68a2b9' : 'rgba(27,60,90,0.15)' }}
          aria-label="Toggle members-only"
        >
          <span
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
            style={{ transform: values.isMembersOnly ? 'translateX(22px)' : 'translateX(2px)' }}
          />
        </button>
        <div>
          <span className="font-condensed font-semibold text-[12px] text-[#1b3c5a] block">
            Members only
          </span>
          <span className="font-condensed text-[10px] text-[#7a8a96]">
            If on, only VIP and Pro tiers can play this episode.
          </span>
        </div>
      </div>

      {/* Pinned toggle */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => set('pinned', !values.pinned)}
          className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0 mt-0.5"
          style={{ backgroundColor: values.pinned ? '#C9A84C' : 'rgba(27,60,90,0.15)' }}
          aria-label="Toggle pinned"
        >
          <span
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
            style={{ transform: values.pinned ? 'translateX(22px)' : 'translateX(2px)' }}
          />
        </button>
        <div>
          <span className="font-condensed font-semibold text-[12px] text-[#1b3c5a] block">
            Pinned ★
          </span>
          <span className="font-condensed text-[10px] text-[#7a8a96]">
            Feature this episode at the top of /podcast. Pinning this one unpins any other.
          </span>
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
