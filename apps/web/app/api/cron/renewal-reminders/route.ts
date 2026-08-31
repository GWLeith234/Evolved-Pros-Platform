/**
 * Daily cron job — renewal reminders.
 *
 * Triggered by an external scheduler (e.g. Vercel Cron, GitHub Actions).
 * Protected by CRON_SECRET to prevent unauthorized execution.
 *
 * Schedule: run once per day (e.g. "0 9 * * *")
 *
 * TODO(VENDASTA-3): renewal reminders need a Stripe implementation.
 * The previous contact-tag path was a no-op (no real user had a
 * contact id). This route stays authenticated and returns count 0
 * until that work lands. Do not implement Stripe here.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Guard: require CRON_SECRET header
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[Cron] CRON_SECRET is not set')
    return Response.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // TODO(VENDASTA-3): Stripe renewal reminders — do not implement here.
  return Response.json({ ok: true, tagged: 0 })
}
