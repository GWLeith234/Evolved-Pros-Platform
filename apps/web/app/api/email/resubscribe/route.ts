/**
 * POST /api/email/resubscribe — "changed your mind?" on the unsubscribe page.
 *
 * PUBLIC, token-gated exactly like the unsubscribe route: the same signed token
 * that proved someone could unsubscribe proves they can undo it. Kept separate
 * from /api/email/unsubscribe so a mail provider's One-Click POST can never be
 * shaped into a re-subscribe — that endpoint has one effect and only one.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe'
import { resubscribeProspect } from '@/lib/email/suppression'

export async function POST(request: Request) {
  let token: string | null = null
  try {
    const body = (await request.json()) as { token?: unknown }
    token = typeof body.token === 'string' ? body.token : null
  } catch {
    token = null
  }

  const verified = verifyUnsubscribeToken(token)
  if (!verified.ok) {
    console.error('[POST /api/email/resubscribe] token rejected', verified.reason)
    // Neutral: the visitor learns nothing about whether the id was real.
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const result = await resubscribeProspect(verified.prospectId)
  if (result === 'error') {
    console.error('[POST /api/email/resubscribe] write failed')
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
