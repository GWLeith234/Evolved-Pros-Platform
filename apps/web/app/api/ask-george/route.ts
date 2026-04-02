import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const WIDGET_ID = '96dd7dbb-2a14-11f1-93eb-72103b668f62'
const VENDASTA_ORG_ID = 'C5L0'
const TOKEN_URL = 'https://sso-api.vendasta.com/openid/connect/token'
const CHAT_URL = `https://prod.apigateway.co/org/${VENDASTA_ORG_ID}/aiAssistants/${WIDGET_ID}/chat`

// Token cache — reuse within the same process until expiry
let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string | null> {
  // Use VENDASTA_API_KEY directly (existing pattern) if no OAuth creds
  const apiKey = process.env.VENDASTA_API_KEY
  const clientId = process.env.VENDASTA_CLIENT_ID
  const clientSecret = process.env.VENDASTA_CLIENT_SECRET

  // Prefer direct API key if configured
  if (apiKey && !clientId) return apiKey

  // 2-legged OAuth (client_credentials)
  if (!clientId || !clientSecret) {
    if (apiKey) return apiKey
    return null
  }

  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.value
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
      console.error(`[AskGeorge] Token fetch failed ${res.status}: ${text}`)
      return apiKey ?? null
    }
    const data = await res.json() as { access_token: string; expires_in?: number }
    const expiresIn = (data.expires_in ?? 3600) * 1000
    cachedToken = { value: data.access_token, expiresAt: now + expiresIn }
    return data.access_token
  } catch (err) {
    console.error('[AskGeorge] Token error:', err)
    return apiKey ?? null
  }
}

export async function POST(req: NextRequest) {
  // Auth guard
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let message: string
  let history: { role: 'user' | 'assistant'; content: string }[]

  try {
    const body = await req.json() as { message?: string; history?: unknown }
    message = typeof body.message === 'string' ? body.message.trim() : ''
    history = Array.isArray(body.history) ? body.history as { role: 'user' | 'assistant'; content: string }[] : []
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!message) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  const token = await getAccessToken()
  if (!token) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
  }

  try {
    const vendastaRes = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        history: history.map(m => ({ role: m.role, content: m.content })),
      }),
    })

    if (!vendastaRes.ok) {
      const text = await vendastaRes.text().catch(() => '')
      console.error(`[AskGeorge] Chat API ${vendastaRes.status}: ${text}`)
      return NextResponse.json({ error: 'AI service error' }, { status: 502 })
    }

    const data = await vendastaRes.json() as {
      reply?: string
      message?: string
      content?: string
      response?: string
      // Some endpoints wrap in choices
      choices?: { message?: { content?: string }; text?: string }[]
    }

    // Normalise various possible response shapes
    const reply =
      data.reply ??
      data.message ??
      data.content ??
      data.response ??
      data.choices?.[0]?.message?.content ??
      data.choices?.[0]?.text ??
      null

    if (!reply) {
      console.error('[AskGeorge] Unexpected response shape:', JSON.stringify(data).slice(0, 300))
      return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 502 })
    }

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[AskGeorge] Network error:', err)
    return NextResponse.json({ error: 'Failed to reach AI service' }, { status: 502 })
  }
}
