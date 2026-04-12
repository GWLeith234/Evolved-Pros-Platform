export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { getVendastaToken } from '@/lib/vendasta/oauth'

const VENDASTA_BASE = 'https://prod.apigateway.co/org/C5L0'

interface SignalBody {
  userId: string
  eventType: 'pillar_complete'
  payload: { pillarNumber: number; pillarName: string }
}

/**
 * POST /api/vendasta/signal
 *
 * Fire-and-forget CRM signal to Vendasta.
 * Always returns 200 — never fails the caller's UI.
 */
export async function POST(request: Request) {
  let body: SignalBody
  try {
    body = (await request.json()) as SignalBody
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid json' }, { status: 200 })
  }

  const { userId, eventType, payload } = body

  if (!userId || !eventType) {
    return NextResponse.json({ ok: false, reason: 'missing fields' }, { status: 200 })
  }

  // Get OAuth token — null means credentials not configured
  const token = await getVendastaToken()
  if (!token) {
    console.warn('[Vendasta Signal] Vendasta signal skipped (no credentials)')
    return NextResponse.json({ ok: true, skipped: true })
  }

  // Look up user email from Supabase
  const { data: profile } = await adminClient
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()

  if (!profile?.email) {
    console.error(`[Vendasta Signal] No email found for user ${userId}`)
    return NextResponse.json({ ok: false, reason: 'no email' }, { status: 200 })
  }

  if (eventType === 'pillar_complete') {
    await sendPillarCompleteSignal(token, profile.email, payload)
  } else {
    console.warn(`[Vendasta Signal] Unknown eventType: ${eventType}`)
  }

  return NextResponse.json({ ok: true })
}

// ---------------------------------------------------------------------------
// Signal handlers
// ---------------------------------------------------------------------------

async function sendPillarCompleteSignal(
  token: string,
  email: string,
  payload: { pillarNumber: number; pillarName: string },
): Promise<void> {
  const { pillarNumber, pillarName } = payload
  const now = new Date().toISOString()

  const fields: Record<string, string> = {
    [`evolved_p${pillarNumber}_complete`]: 'true',
    evolved_last_activity: now,
  }

  try {
    // Look up Vendasta contact by email
    const searchUrl = `${VENDASTA_BASE}/contacts?filter[email]=${encodeURIComponent(email)}`
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!searchRes.ok) {
      const text = await searchRes.text().catch(() => '')
      console.error(`[Vendasta Signal] Contact search failed ${searchRes.status}: ${text}`)
      return
    }

    const searchData = (await searchRes.json()) as { data?: { id: string }[] }
    const contactId = searchData.data?.[0]?.id

    if (!contactId) {
      console.warn(`[Vendasta Signal] No Vendasta contact found for ${email}`)
      return
    }

    // PATCH contact custom fields
    const patchUrl = `${VENDASTA_BASE}/contacts/${contactId}`
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'contacts',
          id: contactId,
          attributes: {
            customFields: fields,
          },
        },
      }),
    })

    if (!patchRes.ok) {
      const text = await patchRes.text().catch(() => '')
      console.error(`[Vendasta Signal] PATCH contact ${contactId} failed ${patchRes.status}: ${text}`)
      return
    }

    console.log(`[Vendasta Signal] Pillar ${pillarNumber} (${pillarName}) complete → contact ${contactId}`)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[Vendasta Signal] Network error: ${msg}`)
  }
}
