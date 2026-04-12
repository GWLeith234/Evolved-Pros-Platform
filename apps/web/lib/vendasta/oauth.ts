/**
 * Vendasta 2-legged OAuth (client_credentials grant).
 *
 * Reads VENDASTA_CLIENT_ID + VENDASTA_CLIENT_SECRET from env.
 * Returns a short-lived bearer token, or null if credentials are missing.
 *
 * Token is cached in-memory for its lifetime minus a 60-second buffer
 * to avoid using an about-to-expire token.
 */

const TOKEN_URL = 'https://sso-api-prod.apigateway.co/oauth2/token'

let cachedToken: string | null = null
let cachedExpiry = 0

export async function getVendastaToken(): Promise<string | null> {
  const clientId = process.env.VENDASTA_CLIENT_ID
  const clientSecret = process.env.VENDASTA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn('[Vendasta OAuth] VENDASTA_CLIENT_ID or VENDASTA_CLIENT_SECRET not set — skipping')
    return null
  }

  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedExpiry) {
    return cachedToken
  }

  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error(`[Vendasta OAuth] Token request failed ${res.status}: ${text}`)
      return null
    }

    const data = (await res.json()) as { access_token: string; expires_in: number }

    cachedToken = data.access_token
    // Cache for (expires_in - 60) seconds
    cachedExpiry = Date.now() + (data.expires_in - 60) * 1000

    return cachedToken
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[Vendasta OAuth] Network error: ${msg}`)
    return null
  }
}
