/**
 * POST /api/media/brief - email brief signup (SPRINT M).
 *
 * PUBLIC and unauthenticated by necessity: the whole point is capturing readers
 * who do not have an account yet. That makes it a write endpoint anyone can
 * reach, so it is deliberately narrow:
 *
 *   - Only an email, a source and a path are read. Nothing else on the body is
 *     looked at, so no caller can smuggle a column in.
 *   - The JSON body is capped (BRIEF_BODY_MAX) before it is parsed.
 *   - A honeypot field ('website') that a real form leaves empty. Answers 200
 *     without writing, so a bot cannot tell it was caught.
 *   - Well-formed submissions are rate-limited per IP, same window as the
 *     other public intake routes. Invalid bodies do not burn the quota.
 *   - Writes through adminClient. The table is service-role only (migration
 *     093) - there is no anon path to it at all.
 *
 * Re-submitting an address is a resubscribe, not a duplicate: the unique index
 * on lower(email) makes that an upsert. The response never distinguishes a new
 * address from a known one - that would make this an address oracle.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import {
  briefPayloadTooLarge,
  normalizeBriefEmail,
  normalizeBriefPath,
  normalizeBriefSource,
  parseBriefJson,
} from '@/lib/media/brief'
import { clientIpFrom, createRateLimiter } from '@/lib/speaking/inquiry'

/**
 * 5 signups per 10 minutes per IP.
 *
 * Best-effort only. The window lives in this process, so it RESETS ON EVERY
 * DEPLOY and is NOT shared between Railway instances. It blunts casual abuse
 * of a public endpoint; it is not a security control.
 */
const limiter = createRateLimiter(5, 10 * 60 * 1000)

export async function POST(request: Request) {
  const contentLength = request.headers.get('content-length')
  if (briefPayloadTooLarge(contentLength, '')) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 })
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }
  if (briefPayloadTooLarge(contentLength, raw)) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 })
  }

  const body = parseBriefJson(raw)
  if (!body) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  // Honeypot. Real submissions leave it empty; answer as if it worked.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true })
  }

  const email = normalizeBriefEmail(body.email)
  if (!email) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 422 })
  }

  // Rate-limit only well-formed submissions, so a visitor fixing a typo does
  // not burn their quota on 422s. The honeypot returned above skips it too.
  if (!limiter.check(clientIpFrom(request.headers))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  const source = normalizeBriefSource(body.source)
  const sourcePath = normalizeBriefPath(body.path)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (adminClient as any)
    .from('media_brief_subscribers')
    .upsert(
      {
        email,
        source,
        source_path: sourcePath,
        status: 'subscribed',
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email', ignoreDuplicates: false },
    )

  if (error) {
    // Code only. Postgres error MESSAGES can echo the row, and the row is an
    // email address - the same PII discipline as campaign_sends.
    console.error('[POST /api/media/brief] write failed', error.code)
    return NextResponse.json({ error: 'write_failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
