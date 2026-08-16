import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import React from 'react'

// ── Mocks must be declared before the module under test is imported ────────
const sendMock = vi.fn()
const insertMock = vi.fn()

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  adminClient: {
    from: (table: string) => ({
      insert: (row: unknown) => insertMock(table, row),
    }),
  },
}))

const { sendCampaignEmail } = await import('./sendCampaignEmail')
const { verifyUnsubscribeToken } = await import('./unsubscribe')

type Recipient = Parameters<typeof sendCampaignEmail>[0]['prospect']

function recipient(overrides: Partial<Recipient> = {}): Recipient {
  return {
    id: 'prospect-1',
    email: 'Dana@Example.com',
    full_name: 'Dana Whitfield',
    consent_basis: 'implied',
    unsubscribed_at: null,
    ...overrides,
  } as Recipient
}

function args(overrides: Record<string, unknown> = {}) {
  return {
    prospect: recipient(),
    subject: 'A webinar you might want',
    react: React.createElement('p', null, 'Body copy'),
    campaignKey: 'webinar-invite-1',
    ...overrides,
  } as Parameters<typeof sendCampaignEmail>[0]
}

let saved: Record<string, string | undefined> = {}

beforeEach(() => {
  saved = {
    UNSUBSCRIBE_SECRET: process.env.UNSUBSCRIBE_SECRET,
    CAMPAIGN_FROM_EMAIL: process.env.CAMPAIGN_FROM_EMAIL,
    CAMPAIGN_SENDER_IDENTITY: process.env.CAMPAIGN_SENDER_IDENTITY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  }
  process.env.UNSUBSCRIBE_SECRET = 'test-secret-value'
  process.env.CAMPAIGN_FROM_EMAIL = 'George Leith <george@mail.evolvedpros.com>'
  process.env.CAMPAIGN_SENDER_IDENTITY = 'GWLeith Revenue Growth Solutions | 1 Example St, Saskatoon SK'
  process.env.NEXT_PUBLIC_APP_URL = 'https://platform.evolvedpros.com'
  sendMock.mockReset().mockResolvedValue({ data: { id: 'resend-abc' }, error: null })
  insertMock.mockReset().mockResolvedValue({ error: null })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  vi.restoreAllMocks()
})

/** The row handed to campaign_sends on the most recent insert. */
function loggedRow(): Record<string, unknown> {
  const call = insertMock.mock.calls.at(-1)
  expect(call?.[0]).toBe('campaign_sends')
  return call?.[1] as Record<string, unknown>
}

describe('sendCampaignEmail — suppression refusals', () => {
  it('refuses to send to an unsubscribed prospect', async () => {
    const res = await sendCampaignEmail(
      args({ prospect: recipient({ unsubscribed_at: '2026-01-01T00:00:00.000Z' }) }),
    )
    expect(res).toEqual({ status: 'suppressed', reason: 'unsubscribed' })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('logs the refusal to campaign_sends as suppressed', async () => {
    await sendCampaignEmail(
      args({ prospect: recipient({ unsubscribed_at: '2026-01-01T00:00:00.000Z' }) }),
    )
    expect(loggedRow()).toMatchObject({
      status: 'suppressed',
      campaign_key: 'webinar-invite-1',
      prospect_id: 'prospect-1',
      error_code: null,
    })
  })

  it("refuses when consent_basis is 'unknown'", async () => {
    const res = await sendCampaignEmail(args({ prospect: recipient({ consent_basis: 'unknown' }) }))
    expect(res).toEqual({ status: 'suppressed', reason: 'consent_unknown' })
    expect(sendMock).not.toHaveBeenCalled()
    expect(loggedRow()).toMatchObject({ status: 'suppressed' })
  })

  it.each(['express', 'implied'] as const)('sends when consent_basis is %s', async basis => {
    const res = await sendCampaignEmail(args({ prospect: recipient({ consent_basis: basis }) }))
    expect(res.status).toBe('sent')
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('checks suppression before consent, and both before building anything', async () => {
    await sendCampaignEmail(
      args({ prospect: recipient({ unsubscribed_at: '2026-01-01T00:00:00.000Z', consent_basis: 'unknown' }) }),
    )
    expect(loggedRow().status).toBe('suppressed')
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('refuses a prospect with no email without touching the log', async () => {
    const res = await sendCampaignEmail(args({ prospect: recipient({ email: '   ' }) }))
    expect(res).toEqual({ status: 'suppressed', reason: 'no_email' })
    expect(sendMock).not.toHaveBeenCalled()
    expect(insertMock).not.toHaveBeenCalled()
  })
})

describe('sendCampaignEmail — sending identity and headers', () => {
  it('sends from CAMPAIGN_FROM_EMAIL, never the transactional sender', async () => {
    process.env.RESEND_FROM_EMAIL = 'Evolved Pros <hello@evolvedpros.com>'
    await sendCampaignEmail(args())
    const payload = sendMock.mock.calls[0][0]
    expect(payload.from).toBe('George Leith <george@mail.evolvedpros.com>')
    expect(payload.from).not.toContain('hello@evolvedpros.com')
  })

  it('normalizes the recipient address to lowercase', async () => {
    await sendCampaignEmail(args())
    expect(sendMock.mock.calls[0][0].to).toBe('dana@example.com')
    expect(loggedRow().email).toBe('dana@example.com')
  })

  it('sets List-Unsubscribe with a verifiable one-click URL', async () => {
    await sendCampaignEmail(args())
    const headers = sendMock.mock.calls[0][0].headers as Record<string, string>
    expect(headers['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click')

    const match = headers['List-Unsubscribe'].match(/<(https:\/\/[^>]+)>/)
    expect(match).not.toBeNull()
    const url = new URL(match![1])
    expect(url.pathname).toBe('/api/email/unsubscribe')
    const verified = verifyUnsubscribeToken(url.searchParams.get('token'))
    expect(verified.ok).toBe(true)
    if (verified.ok) expect(verified.prospectId).toBe('prospect-1')
  })

  it('fails closed when CAMPAIGN_FROM_EMAIL is unset — no fallback sender', async () => {
    delete process.env.CAMPAIGN_FROM_EMAIL
    const res = await sendCampaignEmail(args())
    expect(res).toEqual({ status: 'failed', errorCode: 'missing_campaign_from' })
    expect(sendMock).not.toHaveBeenCalled()
    expect(loggedRow()).toMatchObject({ status: 'failed', error_code: 'missing_campaign_from' })
  })

  it('fails closed when the unsubscribe secret is missing', async () => {
    delete process.env.UNSUBSCRIBE_SECRET
    const res = await sendCampaignEmail(args())
    expect(res).toEqual({ status: 'failed', errorCode: 'missing_unsubscribe_secret' })
    expect(sendMock).not.toHaveBeenCalled()
  })
})

describe('sendCampaignEmail — footer injection', () => {
  it('includes the visible unsubscribe URL in the text alternative', async () => {
    await sendCampaignEmail(args())
    const text = sendMock.mock.calls[0][0].text as string
    expect(text).toContain('/unsubscribe?token=')
    expect(text).toContain('GWLeith Revenue Growth Solutions')
    expect(text).toContain('1 Example St, Saskatoon SK')
  })

  it('appends the footer to the caller body rather than replacing it', async () => {
    await sendCampaignEmail(args())
    const el = sendMock.mock.calls[0][0].react as React.ReactElement
    const children = React.Children.toArray(
      (el.props as { children: React.ReactNode }).children,
    ) as React.ReactElement[]
    expect(children).toHaveLength(2)
    expect(children[0].type).toBe('p')
  })
})

describe('sendCampaignEmail — outcome recording', () => {
  it('records a successful send with the Resend id', async () => {
    const res = await sendCampaignEmail(args())
    expect(res).toEqual({ status: 'sent', resendId: 'resend-abc' })
    expect(loggedRow()).toMatchObject({ status: 'sent', resend_id: 'resend-abc', error_code: null })
  })

  it('records a provider rejection as failed with a code, not a message', async () => {
    sendMock.mockResolvedValue({ data: null, error: { name: 'validation_error', message: 'dana@example.com is invalid' } })
    const res = await sendCampaignEmail(args())
    expect(res).toEqual({ status: 'failed', errorCode: 'validation_error' })
    const row = loggedRow()
    expect(row.error_code).toBe('validation_error')
    expect(JSON.stringify(row)).not.toContain('is invalid')
  })

  it('records a thrown send as failed', async () => {
    sendMock.mockRejectedValue(new Error('socket hang up'))
    const res = await sendCampaignEmail(args())
    expect(res).toEqual({ status: 'failed', errorCode: 'exception' })
    expect(loggedRow()).toMatchObject({ status: 'failed', error_code: 'exception' })
  })

  it('does not throw into the caller when the send log itself fails', async () => {
    insertMock.mockResolvedValue({ error: { code: '42P01' } })
    await expect(sendCampaignEmail(args())).resolves.toEqual({ status: 'sent', resendId: 'resend-abc' })
  })

  it('does not throw into the caller when the send log rejects', async () => {
    insertMock.mockRejectedValue(new Error('connection lost'))
    await expect(sendCampaignEmail(args())).resolves.toEqual({ status: 'sent', resendId: 'resend-abc' })
  })
})
