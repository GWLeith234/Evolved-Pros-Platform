'use client'

import { useId, useState } from 'react'
import { usePathname } from 'next/navigation'
import { BRIEF_COPY, normalizeBriefEmail, type BriefSource } from '@/lib/media/brief'

type Status = 'idle' | 'pending' | 'done' | 'invalid' | 'error'

/**
 * Email brief capture (SPRINT M).
 *
 * Media shipped with no <form> and no <input> anywhere: the rail's "Email
 * brief" entry and the "GET THE BRIEF" button both href'd /podcast, so the one
 * place a reader could hand over an address quietly sent them to a podcast
 * page. This is the real thing - it posts to /api/media/brief and the address
 * lands in media_brief_subscribers.
 *
 * Two variants, one component, so the rail module and the article foot cannot
 * drift apart in copy or behaviour.
 */
export function BriefSignup({
  variant = 'rail',
  source = variant === 'inline' ? 'media-article' : 'media-rail',
}: {
  variant?: 'rail' | 'inline'
  source?: BriefSource
}) {
  const pathname = usePathname()
  const fieldId = useId()
  const statusId = `${fieldId}-status`
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === 'pending') return

    // Check the shape before the round trip so a typo answers instantly. The
    // route re-checks - this is a courtesy, not the validation.
    const normalized = normalizeBriefEmail(email)
    if (!normalized) {
      setStatus('invalid')
      return
    }

    setStatus('pending')
    const form = new FormData(event.currentTarget)
    try {
      const res = await fetch('/api/media/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalized,
          source,
          path: pathname,
          website: form.get('website') ?? '',
        }),
      })
      if (res.ok) {
        setStatus('done')
        setEmail('')
        return
      }
      setStatus(res.status === 422 ? 'invalid' : 'error')
    } catch {
      setStatus('error')
    }
  }

  const message =
    status === 'done'
      ? BRIEF_COPY.success
      : status === 'invalid'
        ? BRIEF_COPY.invalid
        : status === 'error'
          ? BRIEF_COPY.failure
          : null

  return (
    <section
      className={`ep-media-brief ep-media-brief--${variant}`}
      data-media-module="brief-signup"
      data-brief-source={source}
    >
      <p className="ep-media-brief-kicker">{BRIEF_COPY.kicker}</p>
      <p className="ep-media-brief-pitch">{BRIEF_COPY.pitch}</p>

      {status === 'done' ? (
        <p className="ep-media-brief-msg" role="status" id={statusId}>
          {BRIEF_COPY.success}
        </p>
      ) : (
        <form className="ep-media-brief-form" onSubmit={submit} noValidate>
          <label className="ep-sr-only" htmlFor={fieldId}>
            {BRIEF_COPY.label}
          </label>
          <input
            id={fieldId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder={BRIEF_COPY.placeholder}
            value={email}
            onChange={e => {
              setEmail(e.target.value)
              if (status === 'invalid' || status === 'error') setStatus('idle')
            }}
            aria-invalid={status === 'invalid' || undefined}
            aria-describedby={message ? statusId : undefined}
            className="ep-media-brief-input"
          />
          {/* Honeypot. Hidden from people and assistive tech; bots fill it. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="ep-media-brief-hp"
          />
          <button type="submit" className="ep-media-brief-submit" disabled={status === 'pending'}>
            {status === 'pending' ? BRIEF_COPY.pending : BRIEF_COPY.submit}
          </button>
          {message ? (
            <p className="ep-media-brief-msg" role="status" id={statusId}>
              {message}
            </p>
          ) : null}
        </form>
      )}

      <p className="ep-media-brief-fine">{BRIEF_COPY.fineprint}</p>
    </section>
  )
}
