/**
 * Vendasta 2-legged JWT-bearer OAuth (service-account grant).
 *
 * Builds a short-lived ES256 JWT, exchanges it at the SSO token endpoint
 * for a bearer token, and caches the bearer in memory for its lifetime
 * minus a 60-second buffer.
 *
 * Env:
 *   VENDASTA_SERVICE_ACCOUNT_EMAIL — iss / sub claim value
 *   VENDASTA_PRIVATE_KEY           — EC private key for the service account.
 *                                    The loader is tolerant: it accepts PKCS#8
 *                                    ("BEGIN PRIVATE KEY") or SEC1 EC
 *                                    ("BEGIN EC PRIVATE KEY") PEM, real OR
 *                                    "\n"-escaped newlines, an optional pair of
 *                                    wrapping quotes, and a JSON-wrapped key
 *                                    ({ privateKey | private_key | key }).
 */

import { SignJWT } from 'jose'
import { createPrivateKey, type KeyObject } from 'crypto'

// [diag-vendasta] TEMPORARY: exported so app/api/diag-vendasta can POST to the
// same endpoint the production flow uses. WILL REVERT.
export const TOKEN_URL = 'https://sso-api-prod.apigateway.co/oauth2/token'
const AUDIENCE  = TOKEN_URL
const ALGORITHM = 'ES256'

let cachedToken: string | null = null
let cachedExpiry = 0

/**
 * Strip wrapping quotes, unwrap a JSON-wrapped key, and convert escaped
 * "\n" / "\r\n" sequences into real newlines. Pure string transform.
 */
function cleanPemString(raw: string): string {
  let s = raw.trim()

  // Strip a single pair of wrapping single or double quotes.
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim()
  }

  // JSON-wrapped key: take the first present of privateKey / private_key / key.
  if (s.startsWith('{')) {
    try {
      const obj = JSON.parse(s) as Record<string, unknown>
      const candidate = obj.privateKey ?? obj.private_key ?? obj.key
      if (typeof candidate === 'string') s = candidate.trim()
    } catch {
      // Not valid JSON — fall through and parse the string as-is.
    }
  }

  // Collapsed escapes → real newlines (\r\n first so we don't leave stray \r).
  return s.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
}

/** The PEM BEGIN line only — safe to log (never the key body or base64). */
function pemBeginHeader(pem: string): string {
  const line = pem
    .split(/\r?\n/)
    .map(l => l.trim())
    .find(l => l.startsWith('-----BEGIN'))
  return line ?? '(no PEM BEGIN header found)'
}

/**
 * Tolerant private-key loader. Node's createPrivateKey accepts BOTH PKCS#8 and
 * SEC1 EC PEM, where jose's importPKCS8 rejects SEC1 ("must be PKCS#8"). Returns
 * a KeyObject that SignJWT.sign() accepts directly.
 */
function normalizePrivateKey(raw: string | undefined): KeyObject {
  if (!raw || !raw.trim()) {
    throw new Error('VENDASTA_PRIVATE_KEY is empty or not set')
  }
  const pem = cleanPemString(raw)
  try {
    return createPrivateKey(pem)
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    // SAFE diagnostic: only the BEGIN header + reason, never the key body.
    console.error(`[Vendasta OAuth] private-key parse failed — header: "${pemBeginHeader(pem)}", reason: ${reason}`)
    throw new Error(`VENDASTA_PRIVATE_KEY parse failed (header: "${pemBeginHeader(pem)}")`)
  }
}

// [diag-vendasta] TEMPORARY: assertion construction extracted verbatim from
// getVendastaToken (which now calls this same function, so production and the
// diagnostic route exercise the identical signing path) and exported so
// app/api/diag-vendasta can capture the real assertion. Throws on missing env
// or key-parse/sign failure. WILL REVERT.
export async function buildVendastaAssertion(): Promise<string> {
  const serviceAccountEmail = process.env.VENDASTA_SERVICE_ACCOUNT_EMAIL
  const privateKeyRaw       = process.env.VENDASTA_PRIVATE_KEY

  if (!serviceAccountEmail || !privateKeyRaw) {
    throw new Error('VENDASTA_SERVICE_ACCOUNT_EMAIL or VENDASTA_PRIVATE_KEY not set')
  }

  const privateKey = normalizePrivateKey(privateKeyRaw)

  const nowSeconds = Math.floor(Date.now() / 1000)
  return await new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM, kid: process.env.VENDASTA_SERVICE_ACCOUNT_KEY })
    .setIssuer(serviceAccountEmail)
    .setSubject(serviceAccountEmail)
    .setAudience(AUDIENCE)
    .setIssuedAt(nowSeconds)
    .setExpirationTime(nowSeconds + 3600)
    .sign(privateKey)
}

export async function getVendastaToken(): Promise<string | null> {
  const serviceAccountEmail = process.env.VENDASTA_SERVICE_ACCOUNT_EMAIL
  const privateKeyRaw       = process.env.VENDASTA_PRIVATE_KEY

  if (!serviceAccountEmail || !privateKeyRaw) {
    console.warn('[Vendasta OAuth] VENDASTA_SERVICE_ACCOUNT_EMAIL or VENDASTA_PRIVATE_KEY not set — skipping')
    return null
  }

  if (cachedToken && Date.now() < cachedExpiry - 60_000) {
    return cachedToken
  }

  try {
    let assertion: string
    try {
      assertion = await buildVendastaAssertion()
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      // SAFE diagnostic: BEGIN header + reason only.
      console.error(`[Vendasta OAuth] JWT sign failed — header: "${pemBeginHeader(cleanPemString(privateKeyRaw))}", reason: ${reason}`)
      return null
    }

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`[Vendasta OAuth] Token request failed ${res.status}: ${text}`)
      return null
    }

    const data = (await res.json()) as { access_token: string; expires_in: number }

    cachedToken  = data.access_token
    cachedExpiry = Date.now() + data.expires_in * 1000

    return cachedToken
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[Vendasta OAuth] Token exchange failed: ${msg}`)
    return null
  }
}
