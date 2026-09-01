/**
 * Seed / upsert podcast episodes from *_platform_payload.json files.
 *
 * The upstream Descript → transcript step produces one payload per episode
 * whose keys map 1:1 onto public.episodes columns. This script upserts on
 * `slug` (idempotent — re-running an episode updates it, never duplicates) and
 * marks it `is_published: true` so the public /podcast pages can render it.
 *
 * Server-side / local only: uses SUPABASE_SERVICE_ROLE_KEY from the
 * environment. The key is never read client-side and must not be committed.
 *
 * Usage:
 *   SUPABASE_URL=<url> \
 *   SUPABASE_SERVICE_ROLE_KEY=<key> \
 *   npx ts-node --project tsconfig.scripts.json scripts/seed-episode.ts <path…> [--dry-run]
 *
 *   <path…>  one or more payload .json files, and/or directories (every
 *            *_platform_payload.json inside is picked up). Defaults to
 *            data/episodes/ when no path is given.
 *   --dry-run  validate + print what would be written, no DB writes.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEFAULT_DIR = path.join(__dirname, '..', 'data', 'episodes')

// Only these keys are written — unknown payload keys are ignored so an enriched
// payload never breaks the upsert. `slug` + `title` are required (NOT NULL).
const COLUMNS = [
  'slug',
  'episode_number',
  'title',
  'guest_name',
  'guest_bio',
  'published_at',
  'youtube_id',
  'spotify_url',
  'apple_url',
  'duration_seconds',
  'location',
  'summary',
  'tags',
  'chapters',
  'pull_quotes',
  'transcript_text',
  'transcript_segments',
] as const

type EpisodeRow = Record<string, unknown>

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    console.error(`[seed-episode] missing required env var: ${name}`)
    process.exit(1)
  }
  return value
}

/** Expand args into a flat list of .json payload files. */
function collectFiles(args: string[]): string[] {
  const paths = args.length ? args : [DEFAULT_DIR]
  const files: string[] = []
  for (const p of paths) {
    if (!fs.existsSync(p)) {
      console.error(`[seed-episode] path does not exist: ${p}`)
      process.exit(1)
    }
    if (fs.statSync(p).isDirectory()) {
      for (const f of fs.readdirSync(p).sort()) {
        if (f.endsWith('_platform_payload.json') || f.endsWith('.json')) {
          files.push(path.join(p, f))
        }
      }
    } else if (p.endsWith('.json')) {
      files.push(p)
    }
  }
  return files
}

function toRow(file: string, raw: unknown): EpisodeRow {
  const fail = (msg: string): never => {
    console.error(`[seed-episode] ${path.basename(file)}: ${msg}`)
    process.exit(1)
  }
  if (typeof raw !== 'object' || raw === null) fail('not a JSON object')
  const doc = raw as Record<string, unknown>
  if (typeof doc.slug !== 'string' || !doc.slug.trim()) fail('missing required `slug`')
  if (typeof doc.title !== 'string' || !doc.title.trim()) fail('missing required `title`')

  const row: EpisodeRow = { is_published: true }
  for (const key of COLUMNS) {
    if (doc[key] !== undefined) row[key] = doc[key]
  }

  // Guard against placeholder transcript content in early payloads (before the
  // Descript export is finalized). transcript_text is a real SEO body only when
  // it isn't the "SEED FROM SOURCE" placeholder; transcript_segments is only
  // usable as the [{speaker,ts,text}] array shape. Drop non-conforming values
  // so the page falls back cleanly and a later re-seed with real content works.
  if (typeof row.transcript_text === 'string' && /^(SEED FROM SOURCE|PENDING)\b/i.test(row.transcript_text.trim())) {
    console.warn(`[seed-episode] ${doc.slug}: transcript_text is a placeholder — skipping that field`)
    delete row.transcript_text
  }
  if (row.transcript_segments !== undefined && !Array.isArray(row.transcript_segments)) {
    console.warn(`[seed-episode] ${doc.slug}: transcript_segments is not an array — skipping that field`)
    delete row.transcript_segments
  }
  return row
}

async function main() {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const files = collectFiles(argv.filter(a => a !== '--dry-run'))

  if (files.length === 0) {
    console.error('[seed-episode] no payload .json files found')
    process.exit(1)
  }

  const rows = files.map(f => toRow(f, JSON.parse(fs.readFileSync(f, 'utf8'))))
  console.log(`Validated ${rows.length} episode payload(s).`)

  if (dryRun) {
    for (const r of rows) {
      const seg = Array.isArray(r.transcript_segments) ? r.transcript_segments.length : 0
      const txt = typeof r.transcript_text === 'string' ? r.transcript_text.length : 0
      console.log(`  ${r.slug}: "${r.title}" — ${seg} segments, ${txt} transcript chars`)
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
  for (const row of rows) {
    // upsert on slug → idempotent: re-running updates the row in place.
    const { error } = await supabase.from('episodes').upsert(row, { onConflict: 'slug' })
    if (error) failures.push(`${row.slug}: ${error.message}`)
    else {
      ok++
      console.log(`  ✅ ${row.slug}`)
    }
  }

  console.log(`\nDone: ${ok}/${rows.length} upserted.`)
  if (failures.length) {
    console.error(`Failures:\n  ${failures.join('\n  ')}`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
