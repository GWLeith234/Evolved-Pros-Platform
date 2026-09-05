/**
 * POST /api/webhooks/vendasta-conversations
 *
 * Vendasta Business App Automation "Send a webhook" ingress for Conversations
 * AI leads. Shared-secret header, flat JSON, upsert public.crm_prospects with
 * tag `AI George`, then the same admin notifications insert Inquire uses
 * (`system_general` / createNotification path).
 *
 * PII: nothing in this file logs a name, an email, a phone or message content.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAiGeorgeDb } from '@/lib/crm/aiGeorgeDb'
import {
  mapConversationsPayload,
  notifyAdminsOfAiGeorgeLead,
  upsertAiGeorgeProspect,
} from '@/lib/crm/aiGeorge'
import { authorizeConversationsWebhook } from '@/lib/webhooks/sharedSecret'

export async function POST(request: Request) {
  const auth = authorizeConversationsWebhook(request.headers)
  if (!auth.ok) {
    console.error('[POST /api/webhooks/vendasta-conversations] auth', auth.status)
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const mapped = mapConversationsPayload(body)
  if (mapped.kind === 'invalid') {
    return NextResponse.json({ error: mapped.error }, { status: 422 })
  }

  const outcome = await upsertAiGeorgeProspect(supabaseAiGeorgeDb, mapped.value)
  if (outcome.kind === 'error') {
    console.error(
      '[POST /api/webhooks/vendasta-conversations] prospect write failed',
      outcome.code ?? 'unknown',
    )
    return NextResponse.json({ error: 'Lead write failed.' }, { status: 500 })
  }

  const notified = await notifyAdminsOfAiGeorgeLead(
    supabaseAiGeorgeDb,
    mapped.value,
    outcome.id,
  )
  if (notified.code) {
    console.error(
      '[POST /api/webhooks/vendasta-conversations] admin notify failed',
      notified.code,
    )
  }

  return NextResponse.json({ ok: true })
}
