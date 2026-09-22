/**
 * POST /api/media/brief - email brief signup (SPRINT M).
 *
 * PUBLIC and unauthenticated by necessity: the whole point is capturing readers
 * who do not have an account yet. That makes it a write endpoint anyone can
 * reach, so it is deliberately narrow:
 *
 *   - Only an email, a source and a path are read. Nothing else on the body is
 *     looked at, so no caller can smuggle a column in.
 *   - A honeypot field ('website') that a real form leaves empty. Answers 200
 *     without writing, so a bot cannot tell it was caught.
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
  normalizeBriefEmail,
  normalizeBriefPath,
  normalizeBriefSource,
} from '@/lib/media/brief'

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
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
