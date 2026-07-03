/**
 * [diag-vendasta] TEMPORARY diagnostic route — WILL REVERT.
 *
 * Captures one real Vendasta client-assertion JWT (built by the exact
 * production code path in lib/vendasta/oauth.ts) plus the token endpoint's
 * response, and writes everything to server logs (Railway). The HTTP response
 * is always { ok: true } so nothing leaks to the caller.
 *
 * Protected by ?secret= matching DIAG_VENDASTA_SECRET; anything else gets a
 * 404 so the route is not advertised.
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildVendastaAssertion, TOKEN_URL } from '@/lib/vendasta/oauth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const expected = process.env.DIAG_VENDASTA_SECRET
  const provided = req.nextUrl.searchParams.get('secret')
  if (!expected || provided !== expected) {
    return new NextResponse(null, { status: 404 })
  }

  try {
    const assertion = await buildVendastaAssertion()

    const [headerB64, payloadB64, sigB64] = assertion.split('.')
    const header  = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'))
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    const sig     = Buffer.from(sigB64, 'base64url')

    console.log(`[diag-vendasta] assertion JWT: ${assertion}`)
    console.log(`[diag-vendasta] protected header: ${JSON.stringify(header)}`)
    console.log(`[diag-vendasta] payload claims: ${JSON.stringify(payload)}`)
    console.log(
      `[diag-vendasta] signature: ${sig.length} bytes, first byte 0x${sig[0]
        .toString(16)
        .padStart(2, '0')} (64 bytes = raw R||S correct; ~70-72 starting 0x30 = DER bug)`,
    )

    // kid source sanity check — length + BEGIN marker only, never the value.
    const kidEnv = process.env.VENDASTA_SERVICE_ACCOUNT_KEY
    console.log(
      `[diag-vendasta] VENDASTA_SERVICE_ACCOUNT_KEY: ${
        kidEnv === undefined ? 'NOT SET' : `${kidEnv.length} chars`
      }, contains "BEGIN": ${kidEnv?.includes('BEGIN') ?? false}`,
    )

    const nowSeconds = Math.floor(Date.now() / 1000)
    console.log(
      `[diag-vendasta] clock: now=${nowSeconds}, iat=${payload.iat} (iat-now skew ${
        payload.iat - nowSeconds
      }s), exp=${payload.exp} (expires in ${payload.exp - nowSeconds}s)`,
    )

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    })
    const bodyText = await res.text().catch(() => '(unreadable body)')
    console.log(
      `[diag-vendasta] token endpoint response: HTTP ${res.status} — ${bodyText.slice(0, 500)}`,
    )
  } catch (err) {
    console.log(
      `[diag-vendasta] capture failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  return NextResponse.json({ ok: true })
}
