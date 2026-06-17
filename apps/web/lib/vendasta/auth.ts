/**
 * Vendasta checkout token — Sales Orders flow.
 *
 * Vendasta partner *service accounts* do not issue a flat client_id/secret
 * pair, so the old client_credentials grant could never authenticate (it failed
 * with "VENDASTA_CLIENT_ID or VENDASTA_CLIENT_SECRET not set"). The correct
 * grant for these accounts is the signed-JWT (JWT-bearer) flow already
 * implemented in lib/vendasta/oauth.ts and proven on the webhook path.
 *
 * This module keeps getCheckoutToken() as the single checkout entry point so
 * accounts.ts / orders.ts imports don't change — it now simply delegates to
 * that JWT-bearer flow. The token's API permissions are governed by the
 * Vendasta service account itself (no per-token scope is requested, matching
 * the webhook path), so checkout requires ONLY:
 *   VENDASTA_SERVICE_ACCOUNT_EMAIL  — service-account email (iss / sub)
 *   VENDASTA_PRIVATE_KEY            — ES256 PEM private key for that account
 */

import { getVendastaToken } from '@/lib/vendasta/oauth'

export class VendastaAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VendastaAuthError'
  }
}

export async function getCheckoutToken(): Promise<string> {
  // getVendastaToken returns null when its env vars are missing or the token
  // exchange fails (it logs the detail). getCheckoutToken's contract is a
  // non-null string-or-throw, so convert that null into a thrown error naming
  // the env vars checkout actually depends on.
  const token = await getVendastaToken()
  if (!token) {
    throw new VendastaAuthError(
      'VENDASTA_SERVICE_ACCOUNT_EMAIL or VENDASTA_PRIVATE_KEY not set (or token exchange failed) — see logs',
    )
  }
  return token
}
