/**
 * Vendasta OAuth2 client_credentials token fetch — Sales Orders flow.
 *
 * Distinct from lib/vendasta/oauth.ts (JWT-bearer service-account grant used
 * by the webhook enrichment path). This client_credentials grant is what the
 * Sales Orders API requires:
 *   POST https://sso-api-prod.apigateway.co/oauth2/token
 *     grant_type=client_credentials
 *     client_id=VENDASTA_CLIENT_ID
 *     client_secret=VENDASTA_CLIENT_SECRET
 *
 * Tokens are valid 1hr; cached in module-level state and refreshed when
 * within 60s of expiry.
 */

const TOKEN_URL = 'https://sso-api-prod.apigateway.co/oauth2/token'

let cachedToken: string | null = null
let cachedExpiry = 0

export class VendastaAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VendastaAuthError'
  }
}

export async function getCheckoutToken(): Promise<string> {
  const clientId     = process.env.VENDASTA_CLIENT_ID
  const clientSecret = process.env.VENDASTA_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new VendastaAuthError(
      'VENDASTA_CLIENT_ID or VENDASTA_CLIENT_SECRET not set',
    )
  }

  if (cachedToken && Date.now() < cachedExpiry - 60_000) {
    return cachedToken
  }

  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new VendastaAuthError(
      `Token request failed ${res.status}: ${text.slice(0, 300)}`,
    )
  }

  const data = (await res.json()) as {
    access_token?: string
    expires_in?:   number
  }

  if (!data.access_token) {
    throw new VendastaAuthError('Token response missing access_token')
  }

  cachedToken  = data.access_token
  cachedExpiry = Date.now() + (data.expires_in ?? 3600) * 1000
  return cachedToken
}
