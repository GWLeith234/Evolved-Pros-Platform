'use client'

import { useState } from 'react'
import type { PreorderInput } from '@/lib/book/preorder'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'

const GOLD = '#C89A3C'
const GOLD_LIGHT = '#E1BC5B'
const GOLD_DARK = '#B4842A'
const CHARCOAL = '#28282B'
const CHARCOAL_FIELD = '#1f1f22'
const CREAM = '#F3EEE4'
const MUTED = 'rgba(243,238,228,0.55)'

export interface BookPreorderUtm {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
}

interface FormState {
  first_name: string
  last_name: string
  email: string
  website: string
}

const EMPTY: FormState = {
  first_name: '',
  last_name: '',
  email: '',
  website: '',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: FBC,
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: MUTED,
  marginBottom: 6,
}

const fieldStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 46,
  padding: '11px 14px',
  fontFamily: FB,
  fontSize: 15,
  color: CREAM,
  background: CHARCOAL_FIELD,
  border: '1px solid rgba(200,154,60,0.35)',
  borderRadius: 2,
  boxSizing: 'border-box',
}

export function BookPreorderForm({ utm }: { utm: BookPreorderUtm }) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.first_name.trim() && !form.last_name.trim()) {
      return setError('Please add your name.')
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      return setError('Please add a valid email address.')
    }

    const payload: PreorderInput = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      website: form.website,
      ...utm,
    }

    setBusy(true)
    try {
      const res = await fetch('/api/book/preorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
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

  if (sent) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          background: CHARCOAL_FIELD,
          border: '1px solid rgba(200,154,60,0.4)',
          borderLeft: `3px solid ${GOLD}`,
          padding: '22px 24px',
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
            color: GOLD_LIGHT,
          }}
        >
          You&rsquo;re on the list
        </p>
        <p style={{ margin: 0, fontFamily: FB, fontSize: 16, lineHeight: 1.55, color: CREAM }}>
          Thank you. We&rsquo;ll hold your place for EVOLVED. No charge, no membership — just the
          book list.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={e => void submit(e)} noValidate>
      <div aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="bk-website">Website</label>
        <input
          id="bk-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={set('website')}
        />
      </div>

      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div>
          <label style={labelStyle} htmlFor="bk-first">
            First name
          </label>
          <input
            id="bk-first"
            name="first_name"
            value={form.first_name}
            onChange={set('first_name')}
            style={fieldStyle}
            autoComplete="given-name"
            required
          />
        </div>
        <div>
          <label style={labelStyle} htmlFor="bk-last">
            Last name
          </label>
          <input
            id="bk-last"
            name="last_name"
            value={form.last_name}
            onChange={set('last_name')}
            style={fieldStyle}
            autoComplete="family-name"
          />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label style={labelStyle} htmlFor="bk-email">
          Email
        </label>
        <input
          id="bk-email"
          name="email"
          type="email"
          value={form.email}
          onChange={set('email')}
          style={fieldStyle}
          autoComplete="email"
          required
        />
      </div>

      {error && (
        <p
          role="alert"
          style={{
            margin: '16px 0 0',
            fontFamily: FB,
            fontSize: 14,
            lineHeight: 1.5,
            color: GOLD_LIGHT,
            background: CHARCOAL_FIELD,
            border: `1px solid ${GOLD_DARK}`,
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
          marginTop: 22,
          width: '100%',
          padding: '16px 32px',
          minHeight: 48,
          background: `linear-gradient(180deg, ${GOLD_LIGHT}, ${GOLD})`,
          color: CHARCOAL,
          border: 'none',
          borderRadius: 6,
          fontFamily: FBC,
          fontWeight: 800,
          fontSize: 14,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.7 : 1,
          boxShadow: '0 6px 16px -6px rgba(200,154,60,0.6)',
        }}
      >
        {busy ? 'Saving…' : 'Get the book'}
      </button>

      <p
        style={{
          margin: '14px 0 0',
          fontFamily: FB,
          fontSize: 13,
          lineHeight: 1.5,
          color: MUTED,
        }}
      >
        Your name and email go on the Evolved Pros Prospects list with the tag book preorder. No
        charge. No membership.
      </p>
    </form>
  )
}
