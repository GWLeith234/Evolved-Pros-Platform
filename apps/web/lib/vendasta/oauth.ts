/**
 * Vendasta 2-legged JWT-bearer OAuth (service-account grant).
 *
 * Builds a short-lived ES256 JWT, exchanges it at the SSO token endpoint
 * for a bearer token, and caches the bearer in memory for its lifetime
 * minus a 60-second buffer.
 *
 * Env:
 *   VENDASTA_SERVICE_ACCOUNT_EMAIL — iss / sub claim value
 *   VENDASTA_PRIVATE_KEY           — PEM private key from the service account
 *                                    JSON download. Literal "\n" sequences in
 *                                    the env var are replaced with real
 *                                    newlines before import.
 */

import { SignJWT, importPKCS8 } from 'jose'

const TOKEN_URL = 'https://sso-api-prod.apigateway.co/oauth2/token'
const AUDIENCE  = TOKEN_URL
const ALGORITHM = 'ES256'

let cachedToken: string | null = null
let cachedExpiry = 0

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
    const privateKeyPem = privateKeyRaw.replace(/\\n/g, '\n')
    const privateKey    = await importPKCS8(privateKeyPem, ALGORITHM)

    const nowSeconds = Math.floor(Date.now() / 1000)
    const assertion  = await new SignJWT({})
      .setProtectedHeader({ alg: ALGORITHM })
      .setIssuer(serviceAccountEmail)
      .setSubject(serviceAccountEmail)
      .setAudience(AUDIENCE)
      .setIssuedAt(nowSeconds)
      .setExpirationTime(nowSeconds + 3600)
      .sign(privateKey)

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
