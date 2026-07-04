/**
 * One-time import: write HeyGen transcripts into lessons.transcript.
 *
 * Reads every data/transcripts/*.json produced by
 * scripts/heygen-extract-transcripts.ts — shape:
 *   { "lessonSlug": "...", "segments": [{ "timestamp": "0:52", "seconds": 52, "text": "..." }] }
 * — validates it, and writes the segments array into public.lessons.transcript
 * for the row matching lessonSlug.
 *
 * Server-side / local only: uses SUPABASE_SERVICE_ROLE_KEY from the
 * environment. The key is never read anywhere client-side and must not be
 * committed.
 *
 * Usage:
 *   SUPABASE_URL=<url> \
 *   SUPABASE_SERVICE_ROLE_KEY=<key> \
 *   npx ts-node --project tsconfig.scripts.json scripts/import-transcripts.ts [--dry-run]
 *
 * --dry-run validates the files and prints what would be written, without
 * touching the database. Re-running is safe: it overwrites transcript for
 * the listed slugs only.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const TRANSCRIPTS_DIR = path.join(__dirname, '..', 'data', 'transcripts')

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    console.error(`[import-transcripts] missing required env var: ${name}`)
    process.exit(1)
  }
  return value
}

interface Segment { timestamp: string; seconds: number; text: string }
interface TranscriptFile { lessonSlug: string; segments: Segment[] }

const TS_RE = /^\d{1,2}:\d{2}(?::\d{2})?$/

function validate(file: string, raw: unknown): TranscriptFile {
  const fail = (msg: string): never => {
    console.error(`[import-transcripts] ${file}: ${msg}`)
    process.exit(1)
  }
  if (typeof raw !== 'object' || raw === null) fail('not a JSON object')
  const doc = raw as Record<string, unknown>
  if (typeof doc.lessonSlug !== 'string' || !doc.lessonSlug) fail('missing lessonSlug')
  if (!Array.isArray(doc.segments) || doc.segments.length === 0) fail('segments must be a non-empty array')
  doc.segments.forEach((s: unknown, i: number) => {
    const seg = s as Record<string, unknown>
    if (typeof seg?.timestamp !== 'string' || !TS_RE.test(seg.timestamp)) fail(`segments[${i}].timestamp invalid`)
    if (typeof seg?.seconds !== 'number' || !Number.isInteger(seg.seconds) || seg.seconds < 0) fail(`segments[${i}].seconds invalid`)
    if (typeof seg?.text !== 'string' || !seg.text.trim()) fail(`segments[${i}].text empty`)
  })
  // Timestamps must be monotonically non-decreasing — catches scrape glitches.
  const secs = (doc.segments as Segment[]).map(s => s.seconds)
  for (let i = 1; i < secs.length; i++) {
    if (secs[i] < secs[i - 1]) fail(`segments out of order at index ${i} (${secs[i - 1]}s → ${secs[i]}s)`)
  }
  return doc as unknown as TranscriptFile
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  if (!fs.existsSync(TRANSCRIPTS_DIR)) {
    console.error(`[import-transcripts] ${TRANSCRIPTS_DIR} does not exist — run transcripts:extract first`)
    process.exit(1)
  }
  const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json')).sort()
  if (files.length === 0) {
    console.error('[import-transcripts] no JSON files found — run transcripts:extract first')
    process.exit(1)
  }

  const docs = files.map(f =>
    validate(f, JSON.parse(fs.readFileSync(path.join(TRANSCRIPTS_DIR, f), 'utf8'))),
  )
  console.log(`Validated ${docs.length} transcript file(s).`)

  if (dryRun) {
    for (const d of docs) {
      const last = d.segments[d.segments.length - 1]
      console.log(`  ${d.lessonSlug}: ${d.segments.length} segments, last at ${last.timestamp}`)
    }
    console.log('Dry run — no database writes.')
    return
  }

  const supabase = createClient(
    requireEnv('SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)', SUPABASE_URL),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY', SERVICE_KEY),
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  let ok = 0
  const failures: string[] = []
  for (const doc of docs) {
    const { data, error } = await supabase
      .from('lessons')
      .update({ transcript: doc.segments })
      .eq('slug', doc.lessonSlug)
      .select('id, slug')
    if (error) {
      failures.push(`${doc.lessonSlug}: ${error.message}`)
    } else if (!data || data.length === 0) {
      failures.push(`${doc.lessonSlug}: no lessons row with that slug`)
    } else {
      ok++
      console.log(`  ✅ ${doc.lessonSlug} (${doc.segments.length} segments)`)
    }
  }

  console.log(`\nDone: ${ok}/${docs.length} imported.`)
  if (failures.length) {
    console.error(`Failures:\n  ${failures.join('\n  ')}`)
    process.exit(1)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
