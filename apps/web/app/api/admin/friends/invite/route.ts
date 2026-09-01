export const dynamic = 'force-dynamic'

import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { requireAdminApi } from '@/lib/admin/helpers'
import { sendFriendInviteEmail } from '@/lib/resend/emails/friend-invite'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://platform.evolvedpros.com'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/admin/friends/invite — admin sends Friends of George invites.
// Body: { emails: string } (comma/newline separated) OR { emails: string[] }.
// Upserts a friend_invites row per email with a fresh token, emails a durable
// /welcome?token= link (best-effort — see the copy-link fallback in the UI).
export async function POST(request: Request) {
  const guard = await requireAdminApi()
  if (guard instanceof Response) return guard

  // invited_by references auth.users — use the admin's auth id, not the
  // public.users id requireAdminApi returns (the two can diverge).
  const supabase = createClient()
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser()

  let body: { emails?: unknown }
  try {
    body = (await request.json()) as { emails?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const raw = body.emails
  const list = Array.isArray(raw)
    ? raw.map(String)
    : typeof raw === 'string'
      ? raw.split(/[\s,;]+/)
      : []
  const emails = Array.from(
    new Set(list.map(e => e.trim().toLowerCase()).filter(Boolean)),
  )
  if (emails.length === 0) {
    return NextResponse.json({ error: 'Enter at least one email.' }, { status: 422 })
  }
  if (emails.length > 200) {
    return NextResponse.json({ error: 'Too many emails (max 200 per batch).' }, { status: 422 })
  }

  const invalid = emails.filter(e => !EMAIL_RE.test(e))
  const valid = emails.filter(e => EMAIL_RE.test(e))
  if (valid.length === 0) {
    return NextResponse.json({ error: 'No valid emails found.', invalid }, { status: 422 })
  }

  // The single shared comp code drives what these invites grant.
  const { data: code } = await (adminClient as any)
    .from('promo_codes')
    .select('id')
    .eq('code', 'FRIENDSOFGEORGE')
    .maybeSingle()
  const promoCodeId: string | null = code?.id ?? null

  const now = new Date().toISOString()
  const results: { email: string; delivered: boolean }[] = []

  for (const email of valid) {
    const token = randomUUID()
    const { error: upErr } = await (adminClient as any).from('friend_invites').upsert(
      {
        email,
        promo_code_id: promoCodeId,
        invited_by: adminUser?.id ?? null,
        token,
        status: 'invited',
        sent_at: now,
        redeemed_at: null,
      },
      { onConflict: 'email' },
    )
    if (upErr) {
      results.push({ email, delivered: false })
      continue
    }
    const inviteUrl = `${APP_URL}/welcome?token=${token}`
    const delivered = await sendFriendInviteEmail(email, inviteUrl)
    results.push({ email, delivered })
  }

  // Return the canonical rows (with tokens) so the UI can render copy-links.
  const { data: rows } = await (adminClient as any)
    .from('friend_invites')
    .select('id, email, status, token, sent_at, redeemed_at')
    .in('email', valid)

  return NextResponse.json({
    ok: true,
    invited: valid.length,
    invalid,
    delivered: results.filter(r => r.delivered).length,
    rows: rows ?? [],
  })
}
