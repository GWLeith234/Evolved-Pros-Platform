'use client'

import { useState } from 'react'
import { INQUIRY_MESSAGE_MAX } from '@/lib/speaking/inquiry'

// SPRINT KN-1 — the public "Book George to Speak" form. Lives on /live directly
// under the Now Booking CTA, which anchors here.
//
// Colours come from the .live-force-dark token set that wraps the whole page:
// those tokens resolve to the same dark values under html.light-mode, so this
// section is theme-correct in both themes by rendering identically — matching
// every other block on /live.

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'

interface FormState {
  full_name: string
  email: string
  company: string
  event_name: string
  event_timeframe: string
  message: string
  /** Honeypot — hidden from humans, irresistible to bots. */
  website: string
}

const EMPTY: FormState = {
  full_name: '',
  email: '',
  company: '',
  event_name: '',
  event_timeframe: '',
  message: '',
  website: '',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: FBC,
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--text-3)',
  marginBottom: 6,
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 46,
  padding: '11px 14px',
  fontFamily: FB,
  fontSize: 15,
  color: 'var(--text-1)',
  background: 'var(--bg-page)',
  border: '1px solid var(--border-soft2)',
  borderRadius: 2,
  boxSizing: 'border-box',
}

export function LiveBookingInquiry() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.full_name.trim()) return setError('Please add your name.')
    if (!form.email.trim() || !form.email.includes('@')) return setError('Please add a valid email address.')
    if (!form.message.trim()) return setError('Tell us a little about the event.')
    if (form.message.trim().length > INQUIRY_MESSAGE_MAX) {
      return setError(`Message is too long — ${INQUIRY_MESSAGE_MAX} characters maximum.`)
    }

    setBusy(true)
    try {
      const res = await fetch('/api/speaking/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        // Form state is deliberately preserved on failure — nobody should have
        // to retype an event brief because a request timed out.
        setError(json.error ?? 'Something went wrong. Please try again.')
        return
      }
      setForm(EMPTY)
      setSent(true)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section id="book-george" className="live-section-pad" style={{ margin: '0 auto 88px', scrollMarginTop: 24 }}>
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-soft2)',
          borderTop: '3px solid var(--brand-gold)',
          padding: 'clamp(24px, 4vw, 40px)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: FBC,
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.42em',
            textTransform: 'uppercase',
            color: 'var(--brand-gold)',
          }}
        >
          Book George to Speak
        </p>
        <h3
          style={{
            margin: '8px 0 8px',
            fontFamily: FBN,
            fontSize: 'clamp(34px, 5vw, 54px)',
            lineHeight: 0.98,
            letterSpacing: '0.02em',
            color: 'var(--text-strong)',
            textTransform: 'uppercase',
          }}
        >
          Tell us about the room
        </h3>
        <p style={{ margin: '0 0 24px', fontFamily: FB, fontSize: 15, lineHeight: 1.55, color: 'var(--text-2)', maxWidth: 560 }}>
          The audience, the outcome, roughly when. George or his team will come back within 48 hours.
        </p>

        {sent ? (
          <div
            role="status"
            aria-live="polite"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-soft2)',
              borderLeft: '3px solid var(--brand-teal)',
              padding: '20px 22px',
              maxWidth: 560,
            }}
          >
            <p
              style={{
                margin: '0 0 6px',
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--brand-teal)',
              }}
            >
              Got it
            </p>
            <p style={{ margin: '0 0 14px', fontFamily: FB, fontSize: 15, lineHeight: 1.55, color: 'var(--text-1)' }}>
              George will be in touch. If it&rsquo;s urgent, reply straight to the confirmation and it lands in the
              same place.
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-soft2)',
                color: 'var(--text-2)',
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                padding: '10px 16px',
                minHeight: 40,
                cursor: 'pointer',
              }}
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={e => void submit(e)} noValidate style={{ maxWidth: 680 }}>
            {/* Honeypot: off-screen, unfocusable, not announced. A human never
                fills this; a naive bot fills every input it finds. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
              <label htmlFor="kn-website">Website</label>
              <input
                id="kn-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={set('website')}
              />
            </div>

            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <div>
                <label style={labelStyle} htmlFor="kn-name">Your name *</label>
                <input id="kn-name" value={form.full_name} onChange={set('full_name')} style={fieldStyle} autoComplete="name" required />
              </div>
              <div>
                <label style={labelStyle} htmlFor="kn-email">Email *</label>
                <input id="kn-email" type="email" value={form.email} onChange={set('email')} style={fieldStyle} autoComplete="email" required />
              </div>
              <div>
                <label style={labelStyle} htmlFor="kn-company">Company</label>
                <input id="kn-company" value={form.company} onChange={set('company')} style={fieldStyle} autoComplete="organization" />
              </div>
              <div>
                <label style={labelStyle} htmlFor="kn-event">Event name</label>
                <input id="kn-event" value={form.event_name} onChange={set('event_name')} style={fieldStyle} />
              </div>
              <div>
                <label style={labelStyle} htmlFor="kn-when">Timeframe</label>
                <input id="kn-when" value={form.event_timeframe} onChange={set('event_timeframe')} style={fieldStyle} placeholder="e.g. Q1 2027" />
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle} htmlFor="kn-message">What do you need them to walk out with? *</label>
              <textarea
                id="kn-message"
                value={form.message}
                onChange={set('message')}
                rows={5}
                maxLength={INQUIRY_MESSAGE_MAX}
                style={{ ...fieldStyle, minHeight: 130, resize: 'vertical', paddingTop: 12 }}
                required
              />
              <p style={{ margin: '6px 0 0', fontFamily: FBC, fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-3)' }}>
                {form.message.length} / {INQUIRY_MESSAGE_MAX}
              </p>
            </div>

            {error && (
              <p
                role="alert"
                style={{
                  margin: '16px 0 0',
                  fontFamily: FB,
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: 'var(--brand-red-hot)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-soft2)',
                  padding: '10px 14px',
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="ep-pressable ep-touch-target"
              style={{
                marginTop: 20,
                padding: '16px 32px',
                minHeight: 48,
                background: 'var(--brand-red-hot)',
                color: 'var(--white)',
                border: 'none',
                fontFamily: FBC,
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: busy ? 'wait' : 'pointer',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? 'Sending…' : 'Send inquiry'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
