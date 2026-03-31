'use client'

import { useState } from 'react'
import { PILLAR_CONFIG } from '@/lib/pillar-colors'

interface Props {
  courseId: string
  pillarNumber: number
  memberName?: string | null
}

interface CapstoneResult {
  capstone: { id: string; course_id: string; status: string; submitted_at: string }
  nextCourseSlug: string | null
}

const CAPSTONE_PROMPTS: Record<number, string> = {
  1: 'Describe the foundational habits, beliefs, and systems you will commit to as a professional. How has your understanding of a strong foundation changed, and what concrete steps will you take in the next 30 days to reinforce it?',
  2: 'Articulate your professional identity — who you are, what you stand for, and how you present yourself to the world. What specific actions will you take to close the gap between who you are today and the professional you are becoming?',
  3: 'Reflect on a significant mental challenge you have faced or anticipate facing. How have the principles in this pillar equipped you to respond with greater resilience, and what daily practices will you adopt to strengthen your mindset?',
  4: 'Outline your professional strategy for the next 90 days. How does the content in this pillar reshape your approach to planning, prioritization, and decision-making?',
  5: 'Describe your personal accountability system. Who are your accountability partners, what are your non-negotiable commitments, and how will you measure progress over the next quarter?',
  6: 'Define what elite execution looks like for you. What systems, habits, and environments will you put in place to ensure you consistently follow through on your most important work?',
}

const NEXT_PILLAR_LABELS: Record<number, string> = {
  1: 'Begin Identity',
  2: 'Begin Mental Toughness',
  3: 'Begin Strategy',
  4: 'Begin Accountability',
  5: 'Begin Execution',
  6: 'View Dashboard',
}

export function Capstone({ courseId, pillarNumber, memberName }: Props) {
  const config = PILLAR_CONFIG[pillarNumber]
  const color = config?.color ?? '#C9A84C'
  const image = config?.image ? `/images/${config.image}` : null
  const label = config?.label ?? 'Pillar'

  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CapstoneResult | null>(null)

  const charCount = content.length
  const meetsMin = charCount >= 200

  async function handleSubmit() {
    if (!meetsMin) return
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/capstones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, content }),
      })
      const json = await res.json() as CapstoneResult & { error?: string }
      if (!res.ok) {
        setError(json.error ?? 'Failed to submit capstone')
        return
      }
      setResult(json)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  // Completion screen
  if (result) {
    const nextLabel = NEXT_PILLAR_LABELS[pillarNumber] ?? 'Continue'
    const nextHref = result.nextCourseSlug
      ? `/academy/${result.nextCourseSlug}`
      : '/academy'
    const completedDate = result.capstone.submitted_at
      ? new Date(result.capstone.submitted_at).toLocaleDateString('en-US', {
          month: 'long', day: 'numeric', year: 'numeric',
        })
      : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

    return (
      <div
        style={{
          position: 'relative',
          borderRadius: '12px',
          overflow: 'hidden',
          minHeight: '420px',
          backgroundColor: '#0A0F18',
        }}
      >
        {/* Background image */}
        {image && (
          <div
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              opacity: 0.18,
            }}
          />
        )}
        {/* Dark overlay */}
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg, rgba(10,15,24,0.97) 0%, rgba(10,15,24,0.88) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative', zIndex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '420px', padding: '56px 40px', textAlign: 'center',
          }}
        >
          {/* Checkmark circle */}
          <div
            style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: `${color}18`,
              border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '28px',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14.5L11.5 20L22 9" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Pillar badge */}
          <p
            style={{
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '11px', letterSpacing: '0.26em', textTransform: 'uppercase',
              color: color, margin: '0 0 12px',
            }}
          >
            Pillar {pillarNumber} — {label}
          </p>

          {/* Main heading */}
          <h2
            style={{
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 900,
              fontSize: 'clamp(32px, 5vw, 52px)', letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#faf9f7', margin: '0 0 16px', lineHeight: 1.05,
            }}
          >
            {label.toUpperCase()} COMPLETE
          </h2>

          {/* Member name + date */}
          <p
            style={{
              fontSize: '15px', color: 'rgba(250,249,247,0.5)',
              margin: '0 0 40px', lineHeight: 1.6,
            }}
          >
            {memberName ? (
              <><span style={{ color: 'rgba(250,249,247,0.8)', fontWeight: 600 }}>{memberName}</span> &nbsp;·&nbsp; </>
            ) : null}
            {completedDate}
          </p>

          {/* CTA */}
          <a
            href={nextHref}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              backgroundColor: color, color: '#0A0F18',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '13px', letterSpacing: '0.14em', textTransform: 'uppercase',
              padding: '14px 32px', borderRadius: '6px', textDecoration: 'none',
            }}
          >
            {nextLabel} →
          </a>

          {/* Back to academy */}
          <a
            href="/academy"
            style={{
              marginTop: '16px', fontSize: '12px',
              color: 'rgba(250,249,247,0.3)', textDecoration: 'none',
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}
          >
            Back to Academy
          </a>
        </div>
      </div>
    )
  }

  // Submission form
  const prompt = CAPSTONE_PROMPTS[pillarNumber] ?? 'Reflect on your key learnings from this pillar and describe how you will apply them in your professional life.'

  return (
    <div
      style={{
        backgroundColor: '#111926',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '8px',
        padding: '28px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <p
          style={{
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
            color: color, margin: '0 0 4px',
          }}
        >
          Capstone Submission
        </p>
        <p style={{ color: '#faf9f7', fontSize: '15px', fontWeight: 600, margin: '0 0 8px' }}>
          {label} Pillar — Final Reflection
        </p>
        <p style={{ color: 'rgba(250,249,247,0.45)', fontSize: '13px', margin: 0, lineHeight: 1.6 }}>
          Completing your capstone unlocks the next pillar. Write at least 200 characters.
        </p>
      </div>

      {/* Prompt */}
      <div
        style={{
          backgroundColor: `${color}0D`,
          border: `1px solid ${color}22`,
          borderRadius: '6px',
          padding: '16px 20px',
          marginBottom: '20px',
        }}
      >
        <p
          style={{
            fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
            fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: color, margin: '0 0 8px',
          }}
        >
          Prompt
        </p>
        <p style={{ color: 'rgba(250,249,247,0.7)', fontSize: '13px', lineHeight: 1.65, margin: 0 }}>
          {prompt}
        </p>
      </div>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Write your capstone reflection here…"
        rows={10}
        style={{
          width: '100%',
          backgroundColor: 'rgba(255,255,255,0.03)',
          border: `1px solid ${meetsMin ? color + '44' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '6px',
          padding: '16px',
          color: '#faf9f7',
          fontSize: '14px',
          lineHeight: 1.7,
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
      />

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
        <span
          style={{
            fontSize: '12px',
            color: meetsMin ? 'rgba(250,249,247,0.35)' : charCount > 0 ? '#ef0e30' : 'rgba(250,249,247,0.25)',
          }}
        >
          {charCount} / 200 {!meetsMin && charCount > 0 ? `(${200 - charCount} more needed)` : meetsMin ? '✓' : ''}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {error && <span style={{ fontSize: '12px', color: '#ef0e30' }}>{error}</span>}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!meetsMin || submitting}
            style={{
              backgroundColor: meetsMin ? color : `${color}22`,
              color: meetsMin ? '#0A0F18' : `${color}55`,
              fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 700,
              fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '10px 24px', borderRadius: '4px', border: 'none',
              cursor: meetsMin ? 'pointer' : 'default', transition: 'all 0.2s',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit Capstone'}
          </button>
        </div>
      </div>
    </div>
  )
}
