'use client'

import { useState } from 'react'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'

interface FormState {
  name: string
  email: string
  event_date: string
  sms: string
  company: string
  /** Honeypot. Hidden from humans, irresistible to bots. */
  website: string
}

const EMPTY: FormState = {
  name: '',
  email: '',
  event_date: '',
  sms: '',
  company: '',
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
  colorScheme: 'inherit',
}

export function BookingInquiryForm({
  idPrefix = 'bk',
  compact = false,
  onSuccess,
}: {
  idPrefix?: string
  compact?: boolean
  onSuccess?: () => void
}) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) return setError('Please add your name.')
    if (!form.email.trim() || !form.email.includes('@')) {
      return setError('Please add a valid email address.')
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
        setError(json.error ?? 'Something went wrong. Please try again.')
        return
      }
      setForm(EMPTY)
      setSent(true)
      onSuccess?.()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-soft2)',
          borderLeft: '3px solid var(--brand-teal)',
          padding: compact ? '16px 18px' : '20px 22px',
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
          Inquiry received
        </p>
        <p style={{ margin: '0 0 14px', fontFamily: FB, fontSize: 15, lineHeight: 1.55, color: 'var(--text-1)' }}>
          Your details are with the Evolved Pros team. We will follow up shortly.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="ep-pressable ep-touch-target"
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
    )
  }

  return (
    <form onSubmit={e => void submit(e)} noValidate>
      <div aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor={`${idPrefix}-website`}>Website</label>
        <input
          id={`${idPrefix}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={set('website')}
        />
      </div>

      <div
        className="ep-stack--tight"
        style={{
          display: 'grid',
          gap: 'var(--space-card)',
          gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
        }}
      >
        <div>
          <label style={labelStyle} htmlFor={`${idPrefix}-name`}>Name *</label>
          <input
            id={`${idPrefix}-name`}
            name="name"
            value={form.name}
            onChange={set('name')}
            style={fieldStyle}
            autoComplete="name"
            required
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor={`${idPrefix}-email`}>Email *</label>
          <input
            id={`${idPrefix}-email`}
            name="email"
            type="email"
            value={form.email}
            onChange={set('email')}
            style={fieldStyle}
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor={`${idPrefix}-date`}>Date of event</label>
          <input
            id={`${idPrefix}-date`}
            name="event_date"
            type="date"
            value={form.event_date}
            onChange={set('event_date')}
            style={fieldStyle}
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor={`${idPrefix}-sms`}>SMS</label>
          <input
            id={`${idPrefix}-sms`}
            name="sms"
            type="tel"
            inputMode="tel"
            value={form.sms}
            onChange={set('sms')}
            style={fieldStyle}
            autoComplete="tel"
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor={`${idPrefix}-company`}>Company</label>
          <input
            id={`${idPrefix}-company`}
            name="company"
            value={form.company}
            onChange={set('company')}
            style={fieldStyle}
            autoComplete="organization"
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            margin: 'var(--space-card) 0 0',
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
          marginTop: 'var(--space-card-lg)',
          padding: '16px 32px',
          minHeight: 48,
          width: compact ? '100%' : undefined,
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
        {busy ? 'Sending...' : 'Send inquiry'}
      </button>
    </form>
  )
}

export function BookingInquiryHeading({ compact = false }: { compact?: boolean }) {
  return (
    <div style={{ marginBottom: compact ? 16 : 24 }}>
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
        Book George to speak
      </p>
      <h3
        style={{
          margin: '8px 0 8px',
          fontFamily: FBN,
          fontSize: compact ? 32 : 'clamp(34px, 5vw, 54px)',
          lineHeight: 0.98,
          letterSpacing: '0.02em',
          color: 'var(--text-strong)',
          textTransform: 'uppercase',
        }}
      >
        Inquire about booking
      </h3>
      <p style={{ margin: 0, fontFamily: FB, fontSize: 15, lineHeight: 1.55, color: 'var(--text-2)', maxWidth: 560 }}>
        Name and email get it started. Add the date, SMS, and company when you have them.
      </p>
    </div>
  )
}
