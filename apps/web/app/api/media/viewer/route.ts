/**
 * GET /api/media/viewer - which end-of-article CTA the caller should see.
 *
 * Exists so /media/[pillar]/[slug] can stay ISR. Reading the session in the
 * page would make every article dynamic, and the articles are the one part of
 * this site that genuinely benefits from being static for anonymous crawlers.
 * The CTA is the only element on the page that needs to know who is reading,
 * so it asks for itself, after hydration.
 *
 * Returns a single label and nothing else - no id, no email, no tier string.
 * The tier decision is made HERE, server-side, through the existing helpers;
 * the browser never sees enough to make (or fake) it.
 */

export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { resolveCurrentUser } from '@/lib/auth/resolveCurrentUser'
import { hasTierAccess } from '@/lib/tier'
import type { ArticleCtaState } from '@/lib/media/articleCta'

export async function GET() {
  let state: ArticleCtaState = 'anon'
  try {
    const profile = await resolveCurrentUser()
    if (profile) {
      // resolveCurrentUser has already run the row through effectiveTier(), so
      // a dead subscription reads as community here and gets the upgrade CTA.
      state = hasTierAccess(profile.tier, 'vip') ? 'member' : 'free'
    }
  } catch {
    // An auth hiccup must not blank the CTA - the free door is the safe
    // default: it is the only one that is correct for a signed-out reader,
    // and it is merely redundant for anyone else.
    state = 'anon'
  }

  return NextResponse.json(
    { state },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
