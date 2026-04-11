'use client'

import { useState } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 12, fontFamily: 'sans-serif',
  backgroundColor: '#111926', border: '0.5px solid rgba(245,240,232,.12)',
  borderRadius: 6, color: '#F5F0E8', outline: 'none',
}

const EVENT_TYPES = ['Conference', 'SKO', 'Workshop', 'Executive Retreat', 'Other']

export function InquiryForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [org, setOrg] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Name, email, and message are required.')
      return
    }
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/live/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), email: email.trim(), organisation: org.trim(),
          event_type: eventType, event_date: eventDate.trim(), message: message.trim(),
        }),
      })
      if (res.ok) { setSent(true) }
      else {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setError(data.error ?? 'Something went wrong. Email george@evolvedpros.com directly.')
      }
    } catch {
      setError('Something went wrong. Email george@evolvedpros.com directly.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div style={{ padding: '24px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#F5F0E8' }}>Thanks — George will be in touch within 48 hours.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" style={{ maxWidth: 520 }}>
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required style={inputStyle} />
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required style={inputStyle} />
      <input type="text" value={org} onChange={e => setOrg(e.target.value)} placeholder="Company or event name" style={inputStyle} />
      <select value={eventType} onChange={e => setEventType(e.target.value)} style={{ ...inputStyle, appearance: 'none' as const }}>
        <option value="">Event type...</option>
        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <input type="text" value={eventDate} onChange={e => setEventDate(e.target.value)} placeholder="e.g. June 2026 or exact date" style={inputStyle} />
      <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Tell us about your event..." required style={{ ...inputStyle, resize: 'none' as const }} />
      {error && <p style={{ fontSize: 12, color: '#F87171' }}>{error}</p>}
      <button
        type="submit" disabled={sending}
        className="w-full sm:w-auto"
        style={{ padding: '10px 24px', backgroundColor: '#C9302A', color: '#fff', fontSize: 12, fontWeight: 500, fontFamily: 'sans-serif', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: sending ? 0.6 : 1 }}
      >
        {sending ? 'Sending...' : 'Send inquiry'}
      </button>
    </form>
  )
}
