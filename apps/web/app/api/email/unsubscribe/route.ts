/**
 * POST /api/email/unsubscribe — RFC 8058 One-Click unsubscribe target.
 *
 * PUBLIC and unauthenticated by necessity: this is the URL named in the
 * List-Unsubscribe-Post header, and it is called by the RECIPIENT'S MAIL
 * PROVIDER (Gmail, Outlook, Apple Mail), not by a browser with a session. The
 * signed token is the entire credential.
 *
 * Providers post an `application/x-www-form-urlencoded` body of exactly
 * `List-Unsubscribe=One-Click` and carry the token in the URL, so the token is
 * accepted from the query string as well as from a JSON body — a strict
 * JSON-only reading of the spec would silently break real one-click unsubs.
 *
 * Always answers 200. A mail provider treats a non-2xx as a broken unsubscribe
 * and may penalise the sending domain, and there is nothing a caller can
 * usefully do about a bad token anyway. The response body distinguishes
 * nothing about whether the id exists.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'
import { suppressProspect } from '@/lib/email/suppression'

async function tokenFrom(request: Request): Promise<string | null> {
  const fromQuery = new URL(request.url).searchParams.get('token')
  if (fromQuery) return fromQuery

  const contentType = request.headers.get('content-type') ?? ''
  try {
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { token?: unknown }
      return typeof body.token === 'string' ? body.token : null
    }
    // form-urlencoded (what providers actually send) or anything else.
    const text = await request.text()
    if (!text) return null
    return new URLSearchParams(text).get('token')
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const token = await tokenFrom(request)
  const verified = verifyUnsubscribeToken(token)

  if (!verified.ok) {
    // Code-only: never echo the token or say which check failed.
    console.error('[POST /api/email/unsubscribe] token rejected', verified.reason)
    return NextResponse.json({ ok: true })
  }

  const result = await suppressProspect(verified.prospectId)
  if (result === 'error') {
    console.error('[POST /api/email/unsubscribe] suppression write failed')
  }

  return NextResponse.json({ ok: true })
}
