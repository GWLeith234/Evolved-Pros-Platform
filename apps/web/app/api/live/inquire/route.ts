import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try { body = await request.json() } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, organisation, event_type, event_date, message } = body

  if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !message || typeof message !== 'string') {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const text = `New keynote inquiry via Evolved Pros LIVE
──────────────────────────────────────────
Name:         ${name}
Email:        ${email}
Organisation: ${organisation || 'Not provided'}
Event Type:   ${event_type || 'Not specified'}
Event Date:   ${event_date || 'Not specified'}
Message:
${message}
──────────────────────────────────────────
Reply via: https://platform.evolvedpros.com/live`

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
      to: 'geoleith@gmail.com',
      subject: `New keynote inquiry — ${organisation || email}`,
      text,
    })
  } catch (err) {
    console.error('[Live Inquiry] Resend error:', err)
    return Response.json({ error: 'Failed to send. Please email george@evolvedpros.com directly.' }, { status: 500 })
  }

  return Response.json({ ok: true })
}
