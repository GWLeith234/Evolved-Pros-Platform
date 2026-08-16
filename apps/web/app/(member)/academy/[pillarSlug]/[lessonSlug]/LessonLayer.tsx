'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TranscriptSegment } from '@/lib/academy/transcript'
import { AcademyLessonSponsors } from '@/components/academy/AcademyLessonSponsors'
import type { SponsorAd } from '@/components/home/HomeSponsorAd'

interface LessonLayerProps {
  lesson: {
    id: string
    title: string
    description: string | null
    durationSeconds: number | null
    /** Structured segments from lessons.transcript (HeyGen import); a raw
     *  string is still accepted and parsed for backwards compatibility. */
    transcript: TranscriptSegment[] | string | null
    /** Author-written bullets from lessons.key_takeaways. Null/empty falls
     *  back to the legacy description-derived bullets. */
    keyTakeaways: string[] | null
    /** Per-lesson prompt from lessons.discussion_prompt; null falls back
     *  to the generic sitewide reflection prompt. */
    discussionPrompt: string | null
  }
  course: {
    slug: string
    title: string
  }
  pillar: {
    number: number
    label: string
    color: string
  }
  author: string
  isCompleted: boolean
  nextLesson: {
    slug: string
    title: string
    durationSeconds: number | null
    isLocked: boolean
  } | null
  /** Evolution Partner ads — after content, before discussion. */
  sponsorAds?: SponsorAd[]
}

interface TranscriptLine {
  /** Seconds, or null when no parseable timestamp on this line */
  seconds: number | null
  /** Timestamp string as displayed (e.g. "00:42") */
  timestampLabel: string | null
  /** Body text after the timestamp */
  text: string
}

const TOKENS = {
  surface: '#111926',
  border: '#1E2535',
  textPrimary: '#F5F0E8',
  textMuted: '#B4B0A8',
  textSubtle: '#5A6070',
  amber: '#FFA538',
  red: '#C9302A',
}

function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function deriveTakeaways(description: string | null, title: string): string[] {
  if (description) {
    const sentences = description
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 24 && s.length < 240)
    if (sentences.length >= 3) return sentences.slice(0, 5)
    if (sentences.length > 0) return sentences
  }
  // Generic fallbacks anchored to the title so each card still feels relevant.
  return [
    `Understand the core concept behind "${title}".`,
    'Identify where this principle applies in your current week.',
    'Capture one specific commitment in your notes before moving on.',
  ]
}

const TIMESTAMP_RE = /^\s*\[?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*\]?\s*[-–—]?\s*/

function parseTranscript(raw: string | null): TranscriptLine[] {
  if (!raw) return []
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const result: TranscriptLine[] = []
  for (const line of lines) {
    // Skip WEBVTT headers and SRT counter lines.
    if (/^WEBVTT/i.test(line) || /^\d+$/.test(line) || /-->/.test(line)) continue
    const match = TIMESTAMP_RE.exec(line)
    if (match) {
      const a = parseInt(match[1], 10)
      const b = parseInt(match[2], 10)
      const c = match[3] !== undefined ? parseInt(match[3], 10) : null
      const seconds = c !== null
        ? a * 3600 + b * 60 + c   // HH:MM:SS
        : a * 60 + b              // MM:SS
      const label = c !== null
        ? `${String(a).padStart(2, '0')}:${String(b).padStart(2, '0')}:${String(c).padStart(2, '0')}`
        : `${String(a).padStart(2, '0')}:${String(b).padStart(2, '0')}`
      const text = line.slice(match[0].length).trim()
      if (text) result.push({ seconds, timestampLabel: label, text })
    } else {
      result.push({ seconds: null, timestampLabel: null, text: line })
    }
  }
  return result
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-condensed), sans-serif',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: TOKENS.textSubtle,
        marginBottom: 12,
      }}
    >
      {children}
    </p>
  )
}

export function LessonLayer({
  lesson,
  course,
  pillar,
  author,
  isCompleted,
  nextLesson,
  sponsorAds = [],
}: LessonLayerProps) {
  const router = useRouter()
  const draftKey = `ep:lesson-notes:${lesson.id}`
  const [notes, setNotes] = useState('')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [completed, setCompleted] = useState(isCompleted)
  const [marking, setMarking] = useState(false)
  const [markError, setMarkError] = useState<string | null>(null)

  // Load notes from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(draftKey)
      if (stored !== null) setNotes(stored)
    } catch {
      /* ignore — quota / private mode */
    }
  }, [draftKey])

  function handleSaveNotes() {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(draftKey, notes)
      setSavedAt(Date.now())
    } catch {
      /* ignore */
    }
  }

  async function handleMarkComplete() {
    if (completed || marking) return
    setMarking(true)
    setMarkError(null)
    try {
      const res = await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchTimeSeconds: 0, completed: true }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      setCompleted(true)
      router.refresh()
    } catch (err) {
      setMarkError(err instanceof Error ? err.message : 'Could not mark complete')
    } finally {
      setMarking(false)
    }
  }

  // Real authored bullets win; the description-derived fallback only covers
  // lessons whose key_takeaways haven't been entered yet.
  const takeaways = useMemo(
    () => (lesson.keyTakeaways && lesson.keyTakeaways.length > 0
      ? lesson.keyTakeaways
      : deriveTakeaways(lesson.description, lesson.title)),
    [lesson.keyTakeaways, lesson.description, lesson.title],
  )
  const transcriptLines = useMemo<TranscriptLine[]>(() => {
    if (Array.isArray(lesson.transcript)) {
      return lesson.transcript.map(seg => ({
        seconds: seg.seconds,
        timestampLabel: seg.timestamp,
        text: seg.text,
      }))
    }
    return parseTranscript(lesson.transcript)
  }, [lesson.transcript])

  return (
    <div
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: '32px 24px 64px',
        color: TOKENS.textPrimary,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* SECTION 1 — OVERVIEW */}
      <section style={{ position: 'relative', marginBottom: 40 }}>
        <SectionLabel>Overview</SectionLabel>

        {/* Pillar tag — top-right anchor */}
        <span
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            fontFamily: 'var(--font-condensed), sans-serif',
            fontWeight: 700,
            fontSize: 10,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: pillar.color,
            backgroundColor: `${pillar.color}1F`,
            border: `1px solid ${pillar.color}55`,
            borderRadius: 3,
          }}
        >
          P{pillar.number} · {pillar.label}
        </span>

        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 28,
            fontWeight: 700,
            lineHeight: 1.2,
            margin: '0 0 8px',
            color: TOKENS.textPrimary,
            paddingRight: 140,
          }}
        >
          {lesson.title}
        </h1>

        <p
          style={{
            fontFamily: 'var(--font-condensed), sans-serif',
            fontSize: 12,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: TOKENS.textSubtle,
            margin: '0 0 16px',
          }}
        >
          {author} · {formatDuration(lesson.durationSeconds)} · Pillar {pillar.number}
        </p>

        {lesson.description && (
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: TOKENS.textMuted,
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {lesson.description}
          </p>
        )}
      </section>

      {/* SECTION 2 — KEY TAKEAWAYS */}
      <section style={{ marginBottom: 40 }}>
        <SectionLabel>Key Takeaways</SectionLabel>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
          {takeaways.map((t, i) => (
            <li
              key={i}
              style={{
                position: 'relative',
                background: TOKENS.surface,
                border: `1px solid ${TOKENS.border}`,
                borderRadius: 6,
                padding: '14px 16px 14px 22px',
                fontSize: 13,
                lineHeight: 1.6,
                color: '#C4BAB0',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: pillar.color,
                  borderTopLeftRadius: 6,
                  borderBottomLeftRadius: 6,
                }}
              />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* SECTION 3 — TRANSCRIPT */}
      <section style={{ marginBottom: 40 }}>
        <SectionLabel>Transcript</SectionLabel>
        {transcriptLines.length === 0 ? (
          <div
            style={{
              background: TOKENS.surface,
              border: `1px dashed ${TOKENS.border}`,
              borderRadius: 6,
              padding: '20px 16px',
              fontSize: 13,
              color: TOKENS.textSubtle,
              textAlign: 'center',
            }}
          >
            Transcript coming soon
          </div>
        ) : (
          <div
            style={{
              background: TOKENS.surface,
              border: `1px solid ${TOKENS.border}`,
              borderRadius: 6,
              padding: '8px 4px',
            }}
          >
            {transcriptLines.map((line, i) => {
              const isClickable = line.seconds !== null
              const Tag = isClickable ? 'button' : 'div'
              return (
                <Tag
                  key={i}
                  type={isClickable ? 'button' : undefined}
                  onClick={
                    isClickable
                      ? () => window.dispatchEvent(
                          new CustomEvent('academy:seek', { detail: { seconds: line.seconds } }),
                        )
                      : undefined
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 12,
                    width: '100%',
                    padding: '6px 12px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: isClickable ? 'pointer' : 'default',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                  onMouseEnter={isClickable
                    ? e => (e.currentTarget as HTMLElement).style.background = '#1A2330'
                    : undefined}
                  onMouseLeave={isClickable
                    ? e => (e.currentTarget as HTMLElement).style.background = 'transparent'
                    : undefined}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                      fontSize: 11,
                      color: TOKENS.amber,
                      width: 56,
                    }}
                  >
                    {line.timestampLabel ?? ''}
                  </span>
                  <span style={{ fontSize: 13, lineHeight: 1.6, color: TOKENS.textMuted }}>
                    {line.text}
                  </span>
                </Tag>
              )
            })}
          </div>
        )}
      </section>

      {/* SECTION 4 — YOUR NOTES */}
      <section style={{ marginBottom: 40 }}>
        <SectionLabel>Your Notes</SectionLabel>
        <label htmlFor="lesson-notes" className="sr-only">Lesson notes</label>
        <textarea
          id="lesson-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Capture takeaways, questions, and commitments…"
          style={{
            display: 'block',
            width: '100%',
            minHeight: 100,
            padding: 14,
            background: TOKENS.surface,
            border: `1px solid ${TOKENS.border}`,
            borderRadius: 6,
            color: TOKENS.textPrimary,
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = TOKENS.amber)}
          onBlur={e => (e.currentTarget.style.borderColor = TOKENS.border)}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <button
            type="button"
            onClick={handleSaveNotes}
            style={{
              padding: '8px 16px',
              fontFamily: 'var(--font-condensed), sans-serif',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#0A0F18',
              background: TOKENS.amber,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Save Notes
          </button>
          {savedAt && (
            <span
              role="status"
              aria-live="polite"
              style={{ fontSize: 11, color: TOKENS.textSubtle }}
            >
              Saved locally
            </span>
          )}
        </div>
      </section>

      {/* Evolution Partners — after content, before discussion */}
      {sponsorAds.length > 0 && <AcademyLessonSponsors ads={sponsorAds} />}

      {/* SECTION 5 — DISCUSSION */}
      <section style={{ marginBottom: 40 }}>
        <SectionLabel>Discussion</SectionLabel>
        <div
          style={{
            background: TOKENS.surface,
            border: `1px solid ${TOKENS.border}`,
            borderRadius: 6,
            padding: 18,
            marginBottom: 12,
          }}
        >
          <p style={{ margin: 0, fontStyle: 'italic', fontSize: 14, lineHeight: 1.6, color: TOKENS.textMuted }}>
            <strong style={{ color: TOKENS.amber, fontStyle: 'normal', marginRight: 6 }}>
              This week&rsquo;s prompt:
            </strong>
            {lesson.discussionPrompt ??
              'What is one place this lesson contradicts how you currently operate, and what would change next week if you took it seriously?'}
          </p>
        </div>
        <textarea
          placeholder="Reply to the prompt — discussion threads land in a future sprint."
          aria-label="Discussion reply"
          disabled
          style={{
            display: 'block',
            width: '100%',
            minHeight: 80,
            padding: 14,
            background: TOKENS.surface,
            border: `1px dashed ${TOKENS.border}`,
            borderRadius: 6,
            color: TOKENS.textSubtle,
            fontSize: 13,
            lineHeight: 1.6,
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            cursor: 'not-allowed',
          }}
        />
      </section>

      {/* SECTION 6 — UP NEXT */}
      <section style={{ marginBottom: 40 }}>
        <SectionLabel>Up Next</SectionLabel>
        {nextLesson ? (
          <Link
            href={
              nextLesson.isLocked
                ? '#'
                : `/academy/${course.slug}/${nextLesson.slug}`
            }
            aria-disabled={nextLesson.isLocked || undefined}
            onClick={
              nextLesson.isLocked
                ? (e: React.MouseEvent<HTMLAnchorElement>) => e.preventDefault()
                : undefined
            }
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 16,
              background: TOKENS.surface,
              border: `1px solid ${TOKENS.border}`,
              borderRadius: 6,
              textDecoration: 'none',
              opacity: nextLesson.isLocked ? 0.55 : 1,
              cursor: nextLesson.isLocked ? 'not-allowed' : 'pointer',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-condensed), sans-serif',
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: TOKENS.textSubtle,
                }}
              >
                Next lesson · {formatDuration(nextLesson.durationSeconds)}
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontFamily: 'Georgia, serif',
                  fontSize: 16,
                  color: TOKENS.textPrimary,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {nextLesson.title}
              </p>
            </div>
            {nextLesson.isLocked ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TOKENS.textSubtle} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Locked">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ) : (
              <span style={{ fontSize: 18, color: TOKENS.amber }}>→</span>
            )}
          </Link>
        ) : (
          <div
            style={{
              padding: 16,
              background: TOKENS.surface,
              border: `1px dashed ${TOKENS.border}`,
              borderRadius: 6,
              fontSize: 13,
              color: TOKENS.textSubtle,
              textAlign: 'center',
            }}
          >
            You&rsquo;re on the final lesson of this pillar.
          </div>
        )}
      </section>

      {/* CTA ROW */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleMarkComplete}
          disabled={completed || marking}
          aria-busy={marking}
          style={{
            flex: '1 1 220px',
            padding: '14px 20px',
            background: completed ? '#1F6E4A' : TOKENS.red,
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontFamily: 'var(--font-condensed), sans-serif',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: completed || marking ? 'not-allowed' : 'pointer',
            opacity: marking ? 0.7 : 1,
          }}
        >
          {marking ? 'Saving…' : completed ? 'Completed ✓' : 'Mark Complete →'}
        </button>
        <Link
          href={`/academy/${course.slug}`}
          style={{
            flex: '1 1 220px',
            padding: '14px 20px',
            background: 'transparent',
            color: TOKENS.textPrimary,
            border: `1px solid ${TOKENS.border}`,
            borderRadius: 4,
            fontFamily: 'var(--font-condensed), sans-serif',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            textAlign: 'center',
            textDecoration: 'none',
          }}
        >
          ← Back to Course
        </Link>
      </div>
      {markError && (
        <p
          role="alert"
          style={{ marginTop: 10, fontSize: 12, color: TOKENS.red }}
        >
          {markError}
        </p>
      )}
    </div>
  )
}
