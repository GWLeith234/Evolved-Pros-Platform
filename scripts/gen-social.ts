/**
 * Batch-render podcast social cards from content/social-quotes.json.
 *
 * Calls the live /api/social/<template> route (the single render pipeline, so
 * batch output matches OG output) and writes PNGs to
 * apps/web/public/social/<slug>/<template>-<size>.png for download / QA.
 *
 * The route fetches the real logo / faces / mic from Supabase Storage
 * server-side, so run this against an environment that can reach Storage
 * (a deployed URL, or `pnpm --filter web dev` locally with network access).
 *
 * Usage:
 *   SOCIAL_BASE_URL=https://platform.evolvedpros.com \
 *   npx ts-node --project tsconfig.scripts.json scripts/gen-social.ts
 *   (defaults to http://localhost:3000)
 */

import * as fs from 'fs'
import * as path from 'path'

const BASE = (process.env.SOCIAL_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const QUOTES = path.join(__dirname, '..', 'content', 'social-quotes.json')
const OUT_ROOT = path.join(__dirname, '..', 'apps', 'web', 'public', 'social')
const SIZES = ['square', 'portrait'] as const

interface Card {
  episodeSlug: string
  template: 'text' | 'guest' | 'faceoff'
  quote?: string
  attribution?: string
  attributionRole?: string
}

function buildUrl(card: Card, size: string): string {
  const p = new URLSearchParams({ size })
  if (card.episodeSlug) p.set('episodeSlug', card.episodeSlug)
  if (card.quote) p.set('quote', card.quote)
  if (card.attribution) p.set('attribution', card.attribution)
  if (card.attributionRole) p.set('attributionRole', card.attributionRole)
  return `${BASE}/api/social/${card.template}?${p.toString()}`
}

async function main() {
  if (!fs.existsSync(QUOTES)) {
    console.error(`[gen-social] missing ${QUOTES}`)
    process.exit(1)
  }
  const doc = JSON.parse(fs.readFileSync(QUOTES, 'utf8')) as { cards: Card[] }
  const cards = doc.cards ?? []
  if (!cards.length) {
    console.error('[gen-social] no cards in social-quotes.json')
    process.exit(1)
  }
  console.log(`Rendering ${cards.length} card(s) × ${SIZES.length} size(s) via ${BASE}`)

  let ok = 0
  const failures: string[] = []
  for (const card of cards) {
    const dir = path.join(OUT_ROOT, card.episodeSlug)
    fs.mkdirSync(dir, { recursive: true })
    for (const size of SIZES) {
      const url = buildUrl(card, size)
      try {
        const res = await fetch(url)
        if (!res.ok) {
          failures.push(`${card.episodeSlug}/${card.template}-${size}: HTTP ${res.status}`)
          continue
        }
        const buf = Buffer.from(await res.arrayBuffer())
        const file = path.join(dir, `${card.template}-${size}.png`)
        fs.writeFileSync(file, buf)
        ok++
        console.log(`  ✅ ${path.relative(process.cwd(), file)} (${Math.round(buf.length / 1024)} kB)`)
      } catch (err) {
        failures.push(`${card.episodeSlug}/${card.template}-${size}: ${err instanceof Error ? err.message : err}`)
      }
    }
  }

  console.log(`\nDone: ${ok}/${cards.length * SIZES.length} rendered.`)
  if (failures.length) {
    console.error(`Failures:\n  ${failures.join('\n  ')}`)
    process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
