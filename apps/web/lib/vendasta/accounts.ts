/**
 * Vendasta Account Group helper — Sales Orders flow.
 *
 * getOrCreateAccountGroup(userId, email, fullName)
 *   1. SELECTs vendasta_account_group_id from public.users
 *   2. If null, POSTs to https://prod.apigateway.co/platform/salesAccounts
 *      to create an Account Group under partner C5L0
 *   3. Persists the AGID back to public.users via adminClient
 *   4. Returns the AGID string
 *
 * Errors throw — caller (the /api/checkout route) decides the HTTP response.
 */

import { adminClient } from '@/lib/supabase/admin'
import { getCheckoutToken } from '@/lib/vendasta/auth'

const ACCOUNTS_URL = 'https://prod.apigateway.co/platform/salesAccounts'
const PARTNER_ID   = 'C5L0'

export class VendastaAccountsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VendastaAccountsError'
  }
}

interface CreateAccountResponse {
  data?: {
    id?:         string
    attributes?: { accountGroupId?: string; agid?: string }
  }
  id?:             string
  accountGroupId?: string
}

export async function getOrCreateAccountGroup(
  userId:   string,
  email:    string,
  fullName: string | null,
): Promise<string> {
  // 1. Fetch the user row
  const { data: row, error: selErr } = await adminClient
    .from('users')
    .select('vendasta_account_group_id')
    .eq('id', userId)
    .maybeSingle()

  if (selErr) {
    throw new VendastaAccountsError(`users select failed: ${selErr.message}`)
  }

  if (row?.vendasta_account_group_id) {
    return row.vendasta_account_group_id
  }

  // 2. Create the Account Group via Vendasta
  const token = await getCheckoutToken()

  const companyName = fullName?.trim() || email
  const body = {
    data: {
      type:       'salesAccounts',
      attributes: {
        partnerId:   PARTNER_ID,
        companyName,
        email,
        contactName: fullName?.trim() || email.split('@')[0],
      },
    },
  }

  const res = await fetch(ACCOUNTS_URL, {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'application/vnd.api+json',
      Accept:         'application/vnd.api+json',
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  if (!res.ok) {
    console.error('[Vendasta Accounts] create failed', res.status, text.slice(0, 500))
    throw new VendastaAccountsError(
      `salesAccounts POST ${res.status}: ${text.slice(0, 300)}`,
    )
  }

  let parsed: CreateAccountResponse
  try {
    parsed = JSON.parse(text) as CreateAccountResponse
  } catch {
    throw new VendastaAccountsError('salesAccounts response not JSON')
  }

  const agid =
    parsed.data?.attributes?.accountGroupId ??
    parsed.data?.attributes?.agid ??
    parsed.data?.id ??
    parsed.accountGroupId ??
    parsed.id ??
    null

  if (!agid) {
    console.error('[Vendasta Accounts] no AGID in response', text.slice(0, 500))
    throw new VendastaAccountsError('No accountGroupId in salesAccounts response')
  }

  // 3. Persist back to users row
  const { error: updErr } = await adminClient
    .from('users')
    .update({ vendasta_account_group_id: agid })
    .eq('id', userId)

  if (updErr) {
    // Don't throw — the AGID is live in Vendasta; we'll log and continue.
    console.error('[Vendasta Accounts] users update failed:', updErr.message)
  }

  return agid
}
