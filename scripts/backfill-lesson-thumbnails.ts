/**
 * One-time backfill: populate lessons.thumbnail_url from HeyGen.
 *
 * lessons.mux_asset_id actually stores HeyGen video_ids for these lessons
 * (they're HeyGen embeds, not real Mux assets — mux_playback_id is unused).
 * This hits GET /v3/videos/{video_id} for every lesson that hasn't been
 * attempted yet and caches the thumbnail on the row.
 *
 * thumbnail_fetched_at is set on BOTH success and failure so a lesson whose
 * HeyGen video was deleted (404) is never retried — only rows where
 * thumbnail_fetched_at IS NULL are ever selected.
 *
 * Usage:
 *   SUPABASE_URL=<url> \
 *   SUPABASE_SERVICE_ROLE_KEY=<key> \
 *   HEYGEN_API_KEY=<key> \
 *   npx ts-node --project tsconfig.scripts.json scripts/backfill-lesson-thumbnails.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY

// HeyGen's docs (developers.heygen.com/docs/usage-limits) confirm rate
// limiting exists (429 + Retry-After) but don't publish a fixed
// requests-per-second number for this endpoint — 250ms between calls per
// the agreed safe default.
const DELAY_MS = 250

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    console.error(`[backfill-lesson-thumbnails] missing required env var: ${name}`)
    process.exit(1)
  }
  return value
}

const supabaseUrl = requireEnv('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)', SUPABASE_URL)
const serviceKey  = requireEnv('SUPABASE_SERVICE_ROLE_KEY', SERVICE_KEY)
const heygenKey   = requireEnv('HEYGEN_API_KEY', HEYGEN_API_KEY)

const supabase = createClient(supabaseUrl, serviceKey)

interface LessonRow {
  id: string
  slug: string
  mux_asset_id: string
}

interface FailureEntry {
  lessonId: string
  slug: string
  videoId: string
  reason: string
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// HeyGen's v1/v2 APIs wrap the payload in { code, data, message }. Handle
// that shape and a flat shape defensively since v3's exact wrapper isn't
// documented where this was written.
function extractThumbnailUrl(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const asRecord = body as Record<string, unknown>
  const data = (asRecord.data && typeof asRecord.data === 'object')
    ? asRecord.data as Record<string, unknown>
    : asRecord
  const candidate = data.thumbnail_url
  return typeof candidate === 'string' && candidate.length > 0 ? candidate : null
}

async function main() {
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, slug, mux_asset_id')
    .not('mux_asset_id', 'is', null)
    .is('thumbnail_url', null)
    .is('thumbnail_fetched_at', null)

  if (error) {
    console.error('[backfill-lesson-thumbnails] failed to select lessons:', error.message)
    process.exit(1)
  }

  const rows = (lessons ?? []) as LessonRow[]
  console.log(`[backfill-lesson-thumbnails] ${rows.length} lesson(s) to process\n`)

  let succeeded = 0
  const failures: FailureEntry[] = []

  for (const [i, lesson] of rows.entries()) {
    const videoId = lesson.mux_asset_id
    process.stdout.write(`[${i + 1}/${rows.length}] ${lesson.slug} (video ${videoId}) ... `)

    try {
      const res = await fetch(`https://api.heygen.com/v3/videos/${videoId}`, {
        headers: { 'x-api-key': heygenKey },
      })

      const nowIso = new Date().toISOString()

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '')
        const reason = `HTTP ${res.status} ${res.statusText}${bodyText ? ` — ${bodyText.slice(0, 200)}` : ''}`
        console.log(`FAILED (${reason})`)
        failures.push({ lessonId: lesson.id, slug: lesson.slug, videoId, reason })
        await supabase.from('lessons').update({ thumbnail_fetched_at: nowIso }).eq('id', lesson.id)
        await sleep(DELAY_MS)
        continue
      }

      const body = await res.json()
      const thumbnailUrl = extractThumbnailUrl(body)

      if (!thumbnailUrl) {
        const reason = 'HTTP 200 but no thumbnail_url in response body'
        console.log(`FAILED (${reason})`)
        failures.push({ lessonId: lesson.id, slug: lesson.slug, videoId, reason })
        await supabase.from('lessons').update({ thumbnail_fetched_at: nowIso }).eq('id', lesson.id)
        await sleep(DELAY_MS)
        continue
      }

      const { error: updateError } = await supabase
        .from('lessons')
        .update({ thumbnail_url: thumbnailUrl, thumbnail_fetched_at: nowIso })
        .eq('id', lesson.id)

      if (updateError) {
        const reason = `fetched OK but DB update failed: ${updateError.message}`
        console.log(`FAILED (${reason})`)
        failures.push({ lessonId: lesson.id, slug: lesson.slug, videoId, reason })
      } else {
        console.log('OK')
        succeeded++
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      console.log(`FAILED (${reason})`)
      failures.push({ lessonId: lesson.id, slug: lesson.slug, videoId, reason })
      // Network/unexpected error — still record the attempt so this lesson
      // isn't retried indefinitely by future runs.
      await supabase.from('lessons').update({ thumbnail_fetched_at: new Date().toISOString() }).eq('id', lesson.id)
    }

    await sleep(DELAY_MS)
  }

  console.log('\n--- Summary ---')
  console.log(`Total:     ${rows.length}`)
  console.log(`Succeeded: ${succeeded}`)
  console.log(`Failed:    ${failures.length}`)
  if (failures.length > 0) {
    console.log('\nFailures:')
    for (const f of failures) {
      console.log(`  - ${f.slug} (lesson ${f.lessonId}, video ${f.videoId}): ${f.reason}`)
    }
  }
}

main()
