/**
 * Thin wrapper for writing trigger signals to Vendasta contacts.
 *
 * All exported functions are safe for fire-and-forget (void) calls —
 * they catch all errors internally and never throw.
 *
 * IMPORTANT — confirm endpoint format with Brent Yates before go-live.
 * Default:     https://marketplace-api.vendasta.com/v1/contacts/{id}
 * Alternative: https://marketplace-api.vendasta.com/v1/accounts/C5L0/contacts/{id}
 * Override via env: VENDASTA_API_BASE_URL
 */

const API_BASE =
  process.env.VENDASTA_API_BASE_URL ?? 'https://marketplace-api.vendasta.com/v1'

// ---------------------------------------------------------------------------
// Internal PATCH helper
// ---------------------------------------------------------------------------

async function patchContact(
  contactId: string,
  body: Record<string, unknown>,
): Promise<void> {
  const apiKey = process.env.VENDASTA_API_KEY
  if (!apiKey) {
    console.warn('[Vendasta Contacts] VENDASTA_API_KEY not set — skipping')
    return
  }
  const url = `${API_BASE}/contacts/${contactId}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization:  `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error(`[Vendasta Contacts] PATCH ${url} → ${res.status}: ${text}`)
  }
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/** Add a single tag to a contact. Safe for void calls. */
export async function addContactTag(
  contactId: string,
  tag: string,
): Promise<void> {
  try {
    await patchContact(contactId, { add_tags: [tag] })
  } catch (err) {
    console.error('[Vendasta Contacts] addContactTag failed:', err)
  }
}

/** Remove a single tag from a contact. Safe for void calls. */
export async function removeContactTag(
  contactId: string,
  tag: string,
): Promise<void> {
  try {
    await patchContact(contactId, { remove_tags: [tag] })
  } catch (err) {
    console.error('[Vendasta Contacts] removeContactTag failed:', err)
  }
}

/** Write one or more custom fields to a contact. Safe for void calls. */
export async function updateContactFields(
  contactId: string,
  fields: Record<string, string>,
): Promise<void> {
  try {
    await patchContact(contactId, { custom_fields: fields })
  } catch (err) {
    console.error('[Vendasta Contacts] updateContactFields failed:', err)
  }
}

/**
 * Combined: add tags + write custom fields in a single PATCH.
 * Either key is optional. Safe for void calls.
 */
export async function updateContact(
  contactId: string,
  opts: { tags?: string[]; fields?: Record<string, string> },
): Promise<void> {
  try {
    const body: Record<string, unknown> = {}
    if (opts.tags?.length)                         body.add_tags      = opts.tags
    if (opts.fields && Object.keys(opts.fields).length) body.custom_fields = opts.fields
    if (Object.keys(body).length === 0) return
    await patchContact(contactId, body)
  } catch (err) {
    console.error('[Vendasta Contacts] updateContact failed:', err)
  }
}
