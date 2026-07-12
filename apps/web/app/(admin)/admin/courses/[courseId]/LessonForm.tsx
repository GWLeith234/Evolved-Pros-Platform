'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MuxUploader } from '@/components/admin/MuxUploader'
import { parseTranscriptJson } from '@/lib/academy/transcript'
import { MAX_TAKEAWAYS, MAX_TAKEAWAY_LENGTH } from '@/lib/academy/takeaways'
import { ContentBlocksEditor, type ContentBlock } from './ContentBlocksEditor'

interface LessonFormValues {
  title: string
  description: string
  slug: string
  sortOrder: number
  durationSeconds: number | ''
  isPublished: boolean
  /** Raw JSON pasted into the Transcript box ('' = no transcript). */
  transcriptJson: string
  /** Key Takeaways bullets; blank rows are dropped on save. */
  keyTakeaways: string[]
  /** Per-lesson discussion prompt ('' = generic fallback on the page). */
  discussionPrompt: string
  /** Written content blocks (formerly the academy Content Builder). */
  contentBlocks: ContentBlock[]
}

interface LessonFormProps {
  courseId: string
  lessonId?: string
  initialValues?: Partial<LessonFormValues>
  existingPlaybackId?: string | null
  /** Pillar accent color for the content-block type badges. */
  accentColor?: string
}

const DEFAULT_VALUES: LessonFormValues = {
  title: '',
  description: '',
  slug: '',
  sortOrder: 1,
  durationSeconds: '',
  isPublished: false,
  transcriptJson: '',
  keyTakeaways: [],
  discussionPrompt: '',
  contentBlocks: [],
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function LessonForm({ courseId, lessonId, initialValues, existingPlaybackId, accentColor = '#68a2b9' }: LessonFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<LessonFormValues>({ ...DEFAULT_VALUES, ...initialValues })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playbackId, setPlaybackId] = useState<string | null>(existingPlaybackId ?? null)

  function set<K extends keyof LessonFormValues>(key: K, value: LessonFormValues[K]) {
    setValues(prev => ({
      ...prev,
      [key]: value,
      // Auto-generate slug from title if slug hasn't been manually set
      ...(key === 'title' && !lessonId ? { slug: slugify(value as string) } : {}),
    }))
  }

  async function handleUploadComplete(uploadId: string) {
    if (!lessonId) return
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ muxUploadId: uploadId }),
      })
      const data = await res.json() as { lesson?: { mux_playback_id?: string } }
      if (data.lesson?.mux_playback_id) {
        setPlaybackId(data.lesson.mux_playback_id)
      }
    } catch {
      // Non-fatal — Mux webhook will update playback ID once processing completes
    }
  }

  // Live-parse the pasted transcript JSON for the preview + save payload.
  const transcriptParse = useMemo(
    () => parseTranscriptJson(values.transcriptJson),
    [values.transcriptJson],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!transcriptParse.ok) {
      setError(`Transcript JSON: ${transcriptParse.error}`)
      setSaving(false)
      return
    }

    const takeaways = values.keyTakeaways.map(t => t.trim()).filter(Boolean)

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      slug: values.slug.trim() || slugify(values.title),
      sort_order: values.sortOrder,
      duration_seconds: values.durationSeconds === '' ? null : Number(values.durationSeconds),
      is_published: values.isPublished,
      course_id: courseId,
      transcript: transcriptParse.segments,
      key_takeaways: takeaways.length > 0 ? takeaways : null,
      discussion_prompt: values.discussionPrompt.trim() || null,
      content_blocks: values.contentBlocks,
    }

    try {
      let res: Response
      if (lessonId) {
        res = await fetch(`/api/admin/lessons/${lessonId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Save failed')
      }

      router.push(`/admin/courses/${courseId}`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
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
          className="w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none"
          style={{ border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }}
          placeholder="Lesson title"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
          Slug *
        </label>
        <input
          type="text"
          value={values.slug}
          onChange={e => set('slug', e.target.value)}
          required
          maxLength={100}
          className="w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none"
          style={{ border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }}
          placeholder="lesson-slug"
        />
        <p className="font-condensed text-[10px] text-[#7a8a96] mt-1">Used in URL: /academy/[pillar]/[slug]</p>
      </div>

      {/* Description */}
      <div>
        <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
          Description
        </label>
        <textarea
          value={values.description}
          onChange={e => set('description', e.target.value)}
          rows={3}
          className="w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none resize-none"
          style={{ border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }}
          placeholder="Lesson description…"
        />
      </div>

      {/* Sort order + duration */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
            Sort Order *
          </label>
          <input
            type="number"
            value={values.sortOrder}
            onChange={e => set('sortOrder', parseInt(e.target.value) || 1)}
            min={1}
            required
            className="w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none"
            style={{ border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }}
          />
        </div>
        <div>
          <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
            Duration (seconds)
          </label>
          <input
            type="number"
            value={values.durationSeconds}
            onChange={e => set('durationSeconds', e.target.value === '' ? '' : parseInt(e.target.value))}
            min={0}
            className="w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none"
            style={{ border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }}
            placeholder="e.g. 600"
          />
        </div>
      </div>

      {/* Video upload — only available on existing lessons */}
      <div>
        <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
          Video
        </label>
        {lessonId ? (
          <MuxUploader
            lessonId={lessonId}
            existingPlaybackId={playbackId}
            onUploadComplete={handleUploadComplete}
          />
        ) : (
          <div
            className="rounded px-4 py-3"
            style={{ backgroundColor: 'rgba(104,162,185,0.06)', border: '1px solid rgba(104,162,185,0.2)' }}
          >
            <p className="font-condensed text-[11px] text-[#7a8a96]">
              Save the lesson first, then you can upload a video.
            </p>
          </div>
        )}
      </div>

      {/* Discussion Prompt — per-lesson; blank falls back to the sitewide
          generic prompt on the lesson page. */}
      <div>
        <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
          Discussion Prompt
        </label>
        <textarea
          value={values.discussionPrompt}
          onChange={e => set('discussionPrompt', e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full rounded px-3 py-2.5 font-body text-[13px] text-[#1b3c5a] outline-none resize-y"
          style={{ border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }}
          placeholder="Lesson-specific prompt, e.g. “Can you see your lag and lead measures at a glance right now? What's missing from your scoreboard?”"
        />
        <p className="font-condensed text-[10px] text-[#7a8a96] mt-1">
          Blank = the lesson page shows the generic reflection prompt.
        </p>
      </div>

      {/* Key Takeaways — repeatable bullets (2–4 recommended). Rendered on
          the lesson page as the "Key Takeaways" list; when empty the page
          falls back to description-derived bullets. */}
      <div>
        <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
          Key Takeaways
        </label>
        {values.keyTakeaways.length === 0 && (
          <p className="font-condensed text-[11px] text-[#7a8a96] mb-2">
            None yet — the lesson page will derive bullets from the description until takeaways are added. 2–4 recommended.
          </p>
        )}
        <div className="space-y-2">
          {values.keyTakeaways.map((t, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input
                type="text"
                value={t}
                maxLength={MAX_TAKEAWAY_LENGTH}
                onChange={e => {
                  const next = [...values.keyTakeaways]
                  next[i] = e.target.value
                  set('keyTakeaways', next)
                }}
                className="flex-1 rounded px-3 py-2 font-body text-[13px] text-[#1b3c5a] outline-none"
                style={{ border: '1px solid rgba(27,60,90,0.2)', backgroundColor: 'white' }}
                placeholder={`Takeaway ${i + 1}`}
              />
              <button
                type="button"
                aria-label={`Move takeaway ${i + 1} up`}
                disabled={i === 0}
                onClick={() => {
                  const next = [...values.keyTakeaways]
                  ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
                  set('keyTakeaways', next)
                }}
                className="px-1.5 py-1 text-[13px]"
                style={{ color: i === 0 ? 'rgba(27,60,90,0.2)' : '#1b3c5a' }}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move takeaway ${i + 1} down`}
                disabled={i === values.keyTakeaways.length - 1}
                onClick={() => {
                  const next = [...values.keyTakeaways]
                  ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
                  set('keyTakeaways', next)
                }}
                className="px-1.5 py-1 text-[13px]"
                style={{ color: i === values.keyTakeaways.length - 1 ? 'rgba(27,60,90,0.2)' : '#1b3c5a' }}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={`Remove takeaway ${i + 1}`}
                onClick={() => set('keyTakeaways', values.keyTakeaways.filter((_, j) => j !== i))}
                className="px-1.5 py-1 text-[13px]"
                style={{ color: '#ef0e30' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {values.keyTakeaways.length < MAX_TAKEAWAYS && (
          <button
            type="button"
            onClick={() => set('keyTakeaways', [...values.keyTakeaways, ''])}
            className="mt-2 font-condensed font-bold uppercase tracking-[0.14em] text-[11px] px-3 py-1.5 rounded"
            style={{ border: '1px dashed rgba(27,60,90,0.3)', color: '#1b3c5a', backgroundColor: 'transparent' }}
          >
            + Add takeaway
          </button>
        )}
      </div>

      {/* Transcript — paste JSON exported by scripts/heygen-extract-transcripts.ts */}
      <div>
        <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
          Transcript (JSON)
        </label>
        <textarea
          value={values.transcriptJson}
          onChange={e => set('transcriptJson', e.target.value)}
          rows={6}
          spellCheck={false}
          className="w-full rounded px-3 py-2.5 text-[12px] text-[#1b3c5a] outline-none resize-y"
          style={{
            border: `1px solid ${values.transcriptJson && !transcriptParse.ok ? 'rgba(239,14,48,0.5)' : 'rgba(27,60,90,0.2)'}`,
            backgroundColor: 'white',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
          placeholder='Paste segments JSON: [{"timestamp":"0:00","seconds":0,"text":"…"}] or the extractor file {"lessonSlug":"…","segments":[…]}. Leave empty for no transcript.'
        />
        {values.transcriptJson.trim() === '' ? (
          <p className="font-condensed text-[10px] text-[#7a8a96] mt-1">
            Empty — the lesson page will show &ldquo;Transcript coming soon&rdquo;.
          </p>
        ) : !transcriptParse.ok ? (
          <p className="font-condensed text-[11px] mt-1" style={{ color: '#ef0e30' }}>
            {transcriptParse.error}
          </p>
        ) : (
          <div
            className="mt-2 rounded overflow-y-auto"
            style={{ maxHeight: 180, border: '1px solid rgba(27,60,90,0.12)', backgroundColor: 'rgba(27,60,90,0.02)' }}
          >
            <p className="font-condensed font-bold uppercase tracking-[0.14em] text-[9px] text-[#7a8a96] px-3 pt-2">
              Preview — {transcriptParse.segments?.length ?? 0} segments
            </p>
            {(transcriptParse.segments ?? []).map((seg, i) => (
              <div key={i} className="flex items-baseline gap-3 px-3 py-1.5">
                <span
                  className="flex-shrink-0 text-[10px]"
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#68a2b9', width: 48 }}
                >
                  {seg.timestamp}
                </span>
                <span className="font-body text-[12px] text-[#1b3c5a] leading-relaxed">{seg.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content Blocks — written lesson content (video/text/pullquote/
          exercise/quiz). Merged in from the former academy Content Builder so
          a single save persists both the video/meta above and these blocks. */}
      <div>
        <label className="block font-condensed font-bold uppercase tracking-[0.18em] text-[9px] text-[#7a8a96] mb-1.5">
          Content Blocks
        </label>
        <ContentBlocksEditor
          blocks={values.contentBlocks}
          onChange={b => set('contentBlocks', b)}
          accentColor={accentColor}
        />
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
          {values.isPublished ? 'Published' : 'Draft'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(27,60,90,0.08)' }}>
        <a
          href={`/admin/courses/${courseId}`}
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
          {saving ? 'Saving...' : lessonId ? 'Save Changes' : 'Create Lesson'}
        </button>
      </div>
    </form>
  )
}
