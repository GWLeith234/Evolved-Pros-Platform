/**
 * POST /api/speaking/inquiry — public "Book George to Speak" endpoint (KN-1).
 *
 * PUBLIC: no auth. Anyone on /live can post here, so it is deliberately narrow:
 * validate, honeypot, rate-limit, then one prospect write plus best-effort
 * notifications. All writes use adminClient because the submitter has no
 * session and crm_prospects has RLS with no public policies.
 *
 * PII: nothing in this file logs a name, an email or message content. Postgres
 * puts the conflicting value straight into a unique-violation message, so even
 * error paths log codes only — never error.message.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseInquiryDb } from '@/lib/speaking/inquiryDb'
import { sendKeynoteInquiryEmail } from '@/lib/resend/emails/keynote-inquiry'
import {
  clientIpFrom,
  createRateLimiter,
  notifyAdmins,
  upsertKeynoteProspect,
  validateInquiry,
  type InquiryInput,
} from '@/lib/speaking/inquiry'

/**
 * 5 submissions per 10 minutes per IP.
 *
 * Best-effort only — the window lives in this process, so it RESETS ON EVERY
 * DEPLOY and is NOT shared between Railway instances (N instances ≈ N× the
 * quota). It blunts casual abuse of a public endpoint; it is not a security
 * control. Promote to a shared store if it ever needs to be authoritative.
 */
const limiter = createRateLimiter(5, 10 * 60 * 1000)

export async function POST(request: Request) {
  let body: InquiryInput
  try {
    body = (await request.json()) as InquiryInput
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const result = validateInquiry(body)

  // Honeypot: answer exactly like a success so a bot learns nothing from the
  // response, but write nothing and skip the rate-limit bucket entirely.
  if (result.kind === 'bot') {
    return NextResponse.json({ ok: true })
  }

  if (result.kind === 'invalid') {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }

  // Rate-limit only well-formed submissions, so a visitor fixing a typo three
  // times doesn't burn their quota on 422s.
  if (!limiter.check(clientIpFrom(request.headers))) {
    return NextResponse.json(
      { error: 'Too many inquiries from this connection. Please try again shortly.' },
      { status: 429 },
    )
  }

  const inquiry = result.value

  const outcome = await upsertKeynoteProspect(supabaseInquiryDb, inquiry)
  if (outcome.kind === 'error') {
    console.error('[POST /api/speaking/inquiry] prospect write failed', outcome.code ?? 'unknown')
    return NextResponse.json(
      { error: "Something went wrong on our end. Email george@evolvex360.com and we'll pick it up." },
      { status: 500 },
    )
  }

  // In-app admin notification. Best-effort: the inquiry is already durable, so
  // a notifications failure is logged and swallowed rather than surfaced.
  const notified = await notifyAdmins(supabaseInquiryDb, inquiry)
  if (notified.code) {
    console.error('[POST /api/speaking/inquiry] admin notify failed', notified.code)
  }

  // Fire-and-forget email — never awaited, never able to fail the request.
  void sendKeynoteInquiryEmail(inquiry).catch(() => {
    console.error('[POST /api/speaking/inquiry] inquiry email threw')
  })

  return NextResponse.json({ ok: true })
}
