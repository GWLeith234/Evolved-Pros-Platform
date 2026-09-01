/**
 * POST /api/book/preorder — public EVOLVED book preorder (house IAB dest).
 *
 * PUBLIC: no auth. Anyone on /evolved can post here, so it is deliberately
 * narrow: validate, honeypot, rate-limit, then one crm_prospects upsert with
 * tag `book preorder`. All writes use adminClient because the submitter has
 * no session and crm_prospects has RLS with no public policies.
 *
 * Does not email George, does not send marketing mail, does not charge, does
 * not create a membership, does not touch Stripe.
 *
 * PII: nothing in this file logs a name or an email. Postgres puts the
 * conflicting value straight into a unique-violation message, so even error
 * paths log codes only — never error.message.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabasePreorderDb } from '@/lib/book/preorderDb'
import { upsertBookPreorderProspect, validatePreorder, type PreorderInput } from '@/lib/book/preorder'
import { clientIpFrom, createRateLimiter } from '@/lib/speaking/inquiry'

/**
 * 5 submissions per 10 minutes per IP.
 *
 * Best-effort only — the window lives in this process, so it RESETS ON EVERY
 * DEPLOY and is NOT shared between Railway instances. It blunts casual abuse
 * of a public endpoint; it is not a security control.
 */
const limiter = createRateLimiter(5, 10 * 60 * 1000)

export async function POST(request: Request) {
  let body: PreorderInput
  try {
    body = (await request.json()) as PreorderInput
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const result = validatePreorder(body)

  if (result.kind === 'bot') {
    return NextResponse.json({ ok: true })
  }

  if (result.kind === 'invalid') {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }

  if (!limiter.check(clientIpFrom(request.headers))) {
    return NextResponse.json(
      { error: 'Too many submissions from this connection. Please try again shortly.' },
      { status: 429 },
    )
  }

  const outcome = await upsertBookPreorderProspect(supabasePreorderDb, result.value)
  if (outcome.kind === 'error') {
    console.error('[POST /api/book/preorder] prospect write failed', outcome.code ?? 'unknown')
    return NextResponse.json(
      { error: 'Something went wrong on our end. Please try again shortly.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
