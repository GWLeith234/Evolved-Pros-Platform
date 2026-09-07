/**
 * POST /api/auth/magic-link — signup / sign-in email.
 *
 * Replaces browser signInWithOtp (PKCE). generateLink does not send mail;
 * we email a token_hash callback URL via Resend so /auth/callback can
 * verifyOtp without the host-scoped PKCE verifier cookie.
 *
 * PUBLIC: rate-limited, honeypot, email-only. Always 200 { ok: true } on
 * the bot path. Do not leak whether the address already has an account.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { adminClient } from '@/lib/supabase/admin'
import { MagicLinkEmail } from '@/lib/resend/emails/MagicLink'
import { authCallbackUrl, magicLinkCallbackUrl } from '@/lib/auth/authOrigin'
import { MAGIC_LINK_SEND_FAILED, validateMagicLinkRequest } from '@/lib/auth/magicLink'
import { clientIpFrom, createRateLimiter } from '@/lib/speaking/inquiry'

const limiter = createRateLimiter(5, 10 * 60 * 1000)
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL ?? 'Evolved Pros <noreply@evolvedpros.com>'

export async function POST(request: Request) {
  let body: { email?: unknown; next?: unknown; website?: unknown }
  try {
    body = (await request.json()) as { email?: unknown; next?: unknown; website?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const parsed = validateMagicLinkRequest(body)
  if (parsed.kind === 'bot') {
    return NextResponse.json({ ok: true })
  }
  if (parsed.kind === 'invalid') {
    return NextResponse.json({ error: parsed.error }, { status: 422 })
  }

  if (!limiter.check(clientIpFrom(request.headers))) {
    return NextResponse.json(
      { error: 'Too many submissions from this connection. Please try again shortly.' },
      { status: 429 },
    )
  }

  const { email, next } = parsed

  await adminClient.auth.admin.createUser({ email, email_confirm: false }).catch(() => undefined)

  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: authCallbackUrl(next) },
  })

  const hashedToken = linkData?.properties?.hashed_token
  if (linkErr || !hashedToken) {
    console.error('[POST /api/auth/magic-link] generateLink failed', linkErr?.message ?? 'no token')
    return NextResponse.json({ error: MAGIC_LINK_SEND_FAILED }, { status: 500 })
  }

  const loginUrl = magicLinkCallbackUrl(hashedToken, 'magiclink', next)
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: emailError } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email,
    subject: 'Your Evolved Pros login link',
    react: MagicLinkEmail({ magicLink: loginUrl }),
  })

  if (emailError) {
    console.error('[POST /api/auth/magic-link] Resend failed', emailError.message)
    return NextResponse.json({ error: MAGIC_LINK_SEND_FAILED }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
