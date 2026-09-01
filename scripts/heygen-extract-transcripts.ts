/**
 * HeyGen → Academy transcript extractor.
 *
 * Scrapes the timestamped transcript of each Academy lesson's HeyGen project
 * (app.heygen.com → Projects → <video> → Transcript tab) into one JSON file
 * per lesson under data/transcripts/, shaped for the lessons.transcript
 * jsonb column:
 *
 *   { "lessonSlug": "...", "segments": [{ "timestamp": "0:52", "seconds": 52, "text": "..." }] }
 *
 * AUTH — no credentials in this repo, ever. One-time interactive login:
 *
 *   pnpm dlx playwright install chromium        # once, if not installed
 *   npx ts-node --project tsconfig.scripts.json scripts/heygen-extract-transcripts.ts --login
 *
 * A headed browser opens; log into app.heygen.com manually (SSO/2FA fine),
 * then press Enter in the terminal. The session is saved to
 * data/.auth/heygen-state.json (git-ignored — verify before committing).
 *
 * EXTRACT (headless, reuses the saved session):
 *
 *   npx ts-node --project tsconfig.scripts.json scripts/heygen-extract-transcripts.ts
 *   npx ts-node ... -- --only accountability-the-scoreboard   # single lesson
 *
 * HeyGen's app markup is not a stable API. The scraper prefers the
 * Transcript tab's "Copy all" button (clipboard read — most robust),
 * falling back to parsing the visible panel text. If HeyGen ships a
 * redesign, the SELECTORS block below is the only thing to adjust.
 */

import { chromium, type Page, type Locator } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'

const STATE_PATH = path.join(__dirname, '..', 'data', '.auth', 'heygen-state.json')
const OUT_DIR    = path.join(__dirname, '..', 'data', 'transcripts')
const BASE       = 'https://app.heygen.com'

// The 18 published Academy lessons (slug ↔ HeyGen project title match text).
// HeyGen projects are named like "LESSON 02: The Scoreboard" — we search by
// the distinctive title text, not the lesson number.
const LESSONS: Array<{ slug: string; title: string }> = [
  { slug: 'foundation-what-foundation-really-means',            title: 'What Foundation Really Means' },
  { slug: 'foundation-grace-before-you-earned-it',              title: 'Grace Before You Earned It' },
  { slug: 'foundation-foundation-as-architecture',              title: 'Foundation as Architecture' },
  { slug: 'identity-you-do-not-become-who-you-are-alone',       title: 'You Do Not Become Who You Are Alone' },
  { slug: 'identity-the-tiers',                                 title: 'The Tiers' },
  { slug: 'identity-building-deliberately',                     title: 'Building Deliberately' },
  { slug: 'mental-toughness-what-mental-toughness-actually-is', title: 'What Mental Toughness Actually Is' },
  { slug: 'mental-toughness-replace-the-pattern',               title: 'Replace the Pattern' },
  { slug: 'mental-toughness-the-learning-community',            title: 'The Learning Community' },
  { slug: 'strategy-motion-is-not-movement',                    title: 'Motion Is Not Movement' },
  { slug: 'strategy-the-hierarchy',                             title: 'The Hierarchy' },
  { slug: 'strategy-the-strategy-secret',                       title: 'The Strategy Secret' },
  { slug: 'accountability-the-whirlwind-problem',               title: 'The Whirlwind Problem' },
  { slug: 'accountability-the-scoreboard',                      title: 'The Scoreboard' },
  { slug: 'accountability-the-cadence',                         title: 'The Cadence' },
  { slug: 'execution-there-is-no-done',                         title: 'There Is No Done' },
  { slug: 'execution-the-math',                                 title: 'The Math' },
  { slug: 'execution-the-evidence',                             title: 'The Evidence' },
]

// Centralised so a HeyGen redesign is a one-block fix.
const SELECTORS = {
  // HeyGen's Projects search is COLLAPSED by default: the input exists in the
  // DOM but is hidden (tabindex="-1", not visible) until its icon/button is
  // clicked. openSearch() below clicks searchTrigger first, then types into
  // projectSearch. Trigger candidates are broad (aria-label / testid / an
  // icon button sitting next to the input) since HeyGen ships no stable hook.
  searchTrigger:  'button[aria-label*="search" i], [data-testid*="search" i], [class*="search" i] button, button:has(svg[class*="search" i])',
  projectSearch:  'input[placeholder*="Search" i]',
  projectCard:    (title: string) => `a:has-text("${title}"), div[role="link"]:has-text("${title}")`,
  transcriptTab:  'button:has-text("Transcript"), [role="tab"]:has-text("Transcript")',
  copyAllButton:  'button:has-text("Copy all"), button:has-text("Copy All")',
  transcriptPane: '[class*="transcript" i]',
}

// HeyGen's Projects search is collapsed-by-default — the matching <input>
// renders hidden (tabindex="-1") until you click the search icon to expand
// it. Reveal it, then hand back the now-editable input. Resilient: if the
// input is already visible we skip the click; if a trigger is needed we try
// each candidate until the input becomes visible.
async function openSearch(page: Page): Promise<Locator> {
  const input = page.locator(SELECTORS.projectSearch).first()

  // Already expanded? Nothing to click.
  if (await input.isVisible().catch(() => false)) return input

  // Click each trigger candidate; stop as soon as the input reveals.
  const triggers = page.locator(SELECTORS.searchTrigger)
  const count = await triggers.count().catch(() => 0)
  for (let i = 0; i < count; i++) {
    try {
      await triggers.nth(i).click({ timeout: 3_000 })
    } catch {
      continue // not clickable / detached — try the next candidate
    }
    if (await input.isVisible({ timeout: 2_000 }).catch(() => false)) return input
  }

  // Last resort: force-click the input's own box in case the expand handler
  // lives on the (width-collapsed) input itself rather than a sibling icon.
  await input.click({ force: true, timeout: 3_000 }).catch(() => {})

  // Surface a clear error if it's still hidden (fill() would otherwise hang).
  await input.waitFor({ state: 'visible', timeout: 20_000 })
  return input
}

interface Segment { timestamp: string; seconds: number; text: string }

/** "M:SS" or "H:MM:SS" → integer seconds. */
function toSeconds(ts: string): number {
  const parts = ts.split(':').map(n => parseInt(n, 10))
  if (parts.some(Number.isNaN)) throw new Error(`Unparseable timestamp: "${ts}"`)
  return parts.length === 3
    ? parts[0] * 3600 + parts[1] * 60 + parts[2]
    : parts[0] * 60 + parts[1]
}

/**
 * Parse HeyGen transcript text: an M:SS (or H:MM:SS) marker on its own line,
 * followed by one or more text lines, repeated.
 */
function parseTranscriptText(raw: string): Segment[] {
  const MARKER = /^\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*$/
  const segments: Segment[] = []
  let current: Segment | null = null
  for (const line of raw.split(/\r?\n/)) {
    const m = MARKER.exec(line)
    if (m) {
      if (current && current.text) segments.push(current)
      current = { timestamp: m[1], seconds: toSeconds(m[1]), text: '' }
    } else if (current) {
      const text = line.trim()
      if (text) current.text = current.text ? `${current.text} ${text}` : text
    }
  }
  if (current && current.text) segments.push(current)
  return segments
}

async function promptEnter(message: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  await new Promise<void>(resolve => rl.question(`${message}\nPress Enter when done… `, () => resolve()))
  rl.close()
}

async function loginFlow(): Promise<void> {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true })
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext()
  const page    = await context.newPage()
  await page.goto(`${BASE}/login`)
  await promptEnter(`Log into HeyGen in the opened browser (SSO/2FA ok).`)
  await context.storageState({ path: STATE_PATH })
  await browser.close()
  console.log(`✅ Session saved to ${path.relative(process.cwd(), STATE_PATH)} (git-ignored).`)
}

async function extractLesson(page: Page, lesson: { slug: string; title: string }): Promise<Segment[]> {
  // 1. Find the project via search. HeyGen's search is collapsed by default,
  //    so expand it before typing; .fill() then auto-waits for editable.
  await page.goto(`${BASE}/projects`, { waitUntil: 'domcontentloaded' })
  const search = await openSearch(page)
  await search.fill(lesson.title)
  await page.waitForTimeout(1_500) // debounce

  // 2. Open the matching project (first card containing the title text).
  const card = page.locator(SELECTORS.projectCard(lesson.title)).first()
  await card.waitFor({ timeout: 15_000 })
  await card.click()
  await page.waitForLoadState('domcontentloaded')

  // 3. Open the Transcript tab.
  const tab = page.locator(SELECTORS.transcriptTab).first()
  await tab.waitFor({ timeout: 20_000 })
  await tab.click()
  await page.waitForTimeout(1_000)

  // 4a. Preferred: "Copy all" → clipboard (immune to DOM structure).
  try {
    const copyAll = page.locator(SELECTORS.copyAllButton).first()
    await copyAll.waitFor({ timeout: 5_000 })
    await copyAll.click()
    const clip = await page.evaluate(() => navigator.clipboard.readText())
    const segments = parseTranscriptText(clip)
    if (segments.length > 0) return segments
    console.warn(`  ⚠ clipboard parse yielded 0 segments for ${lesson.slug}; falling back to DOM text`)
  } catch {
    console.warn(`  ⚠ "Copy all" not found for ${lesson.slug}; falling back to DOM text`)
  }

  // 4b. Fallback: inner text of the transcript pane (or whole page).
  const pane = page.locator(SELECTORS.transcriptPane).first()
  const text = (await pane.count()) > 0
    ? await pane.innerText()
    : await page.locator('body').innerText()
  return parseTranscriptText(text)
}

async function main() {
  const args  = process.argv.slice(2)
  if (args.includes('--login')) return loginFlow()

  if (!fs.existsSync(STATE_PATH)) {
    console.error(`No saved session. Run with --login first (interactive; nothing is stored in the repo).`)
    process.exit(1)
  }

  const onlyIdx = args.indexOf('--only')
  const targets = onlyIdx >= 0
    ? LESSONS.filter(l => l.slug === args[onlyIdx + 1])
    : LESSONS
  if (targets.length === 0) {
    console.error(`--only matched no known lesson slug`)
    process.exit(1)
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    storageState: STATE_PATH,
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  const page = await context.newPage()

  const failures: string[] = []
  for (const lesson of targets) {
    process.stdout.write(`▶ ${lesson.slug} … `)
    try {
      const segments = await extractLesson(page, lesson)
      if (segments.length === 0) throw new Error('0 segments parsed')
      const outPath = path.join(OUT_DIR, `${lesson.slug}.json`)
      fs.writeFileSync(outPath, JSON.stringify({ lessonSlug: lesson.slug, segments }, null, 2) + '\n')
      console.log(`${segments.length} segments → ${path.relative(process.cwd(), outPath)}`)
    } catch (err) {
      failures.push(lesson.slug)
      console.log(`FAILED: ${err instanceof Error ? err.message : err}`)
    }
  }

  await browser.close()
  console.log(`\nDone. ${targets.length - failures.length}/${targets.length} extracted.`)
  if (failures.length) {
    console.log(`Failed (rerun with --only <slug>, or adjust SELECTORS):\n  ${failures.join('\n  ')}`)
    process.exit(1)
  }
}

main().catch(err => { console.error(err); process.exit(1) })
