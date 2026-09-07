import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { THANKS_CADENCE_STEPS, THANKS_WWW_ORIGIN, type ThanksCadenceStep } from './constants'
import type { ThanksEmailVars } from './copy'

/**
 * send-ready-v13 Creative SoT: Gmail-safe HTML only.
 * TABLES + INLINE STYLES. No CSS classes (v11 class CSS failed in Gmail).
 * Header is the Magic Link text wordmark. NEVER cid:logo / image wordmark.
 * Greeting is exactly {{first_name}}. NEVER {{George}} or {{{{first_name}}}}.
 * cid:george-headshot is OK for the headshot only.
 * claim_url is only the CTA + footer copy-link. Never prefix /media or /podcast.
 */
export const THANKS_V12_DIR_REL = 'lib/resend/emails/community-thanks/v12'
export const THANKS_V12_ASSETS_REL = `${THANKS_V12_DIR_REL}/assets`

export const THANKS_V12_HTML_FILES = {
  0: 'e01-d00.html',
  1: 'e02-d03.html',
  2: 'e03-d06.html',
  3: 'e04-d09.html',
  4: 'e05-d12.html',
  5: 'e06-d16.html',
  6: 'e07-d20.html',
  7: 'e08-d24.html',
  8: 'e09-d28.html',
  9: 'e10-d35.html',
  10: 'e11-d42.html',
  11: 'e12-d56.html',
} as const satisfies Record<ThanksCadenceStep, string>

const CID_LOGO = 'cid:logo'
const CID_HEADSHOT = 'cid:george-headshot'
const TEXT_WORDMARK = 'EVOLVED<span style="color:#ef0e30;">·</span>PROS'
const RESOURCE_HREF = /href="(https:\/\/www\.evolvedpros\.com\/(?:media|podcast)\/[^"]+)"/g
const BARE_HOMEPAGE_HREF = /href=["']https:\/\/www\.evolvedpros\.com\/["']/g
const BARE_HOMEPAGE_TEXT = />https:\/\/www\.evolvedpros\.com\/</g

export function escapeThanksHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function thanksV12DirCandidates(): string[] {
  return [
    resolve(__dirname, '../resend/emails/community-thanks/v12'),
    join(process.cwd(), THANKS_V12_DIR_REL),
    join(process.cwd(), 'apps/web', THANKS_V12_DIR_REL),
  ]
}

export function resolveThanksV12Dir(): string | null {
  for (const dir of thanksV12DirCandidates()) {
    if (existsSync(dir)) return dir
  }
  return null
}

export function thanksV12HtmlPath(step: ThanksCadenceStep): string | null {
  const dir = resolveThanksV12Dir()
  if (!dir) return null
  return join(dir, THANKS_V12_HTML_FILES[step])
}

export function loadThanksV12Html(step: ThanksCadenceStep): string | null {
  const path = thanksV12HtmlPath(step)
  if (!path || !existsSync(path)) return null
  const html = readFileSync(path, 'utf8')
  return html.trim() ? html : null
}

export type ThanksCidAttachment = {
  filename: string
  content: Buffer
  content_id: string
  contentId: string
}

function readFirstExisting(dir: string, names: string[]): { filename: string; content: Buffer } | null {
  for (const filename of names) {
    const path = join(dir, filename)
    if (!existsSync(path)) continue
    return { filename, content: readFileSync(path) }
  }
  return null
}

/** Headshot only. CID logo is retired (failed in inbox). */
export function loadThanksV12CidAttachments(): ThanksCidAttachment[] {
  const dir = resolveThanksV12Dir()
  if (!dir) return []
  const assets = join(dir, 'assets')
  const head = readFirstExisting(assets, [
    'george-headshot.jpg',
    'george-headshot.jpeg',
    'george-headshot.png',
    'george-headshot.webp',
  ])
  if (!head) return []
  return [{ ...head, content_id: 'george-headshot', contentId: 'george-headshot' }]
}

function resourceHrefs(html: string): string[] {
  return [...html.matchAll(RESOURCE_HREF)].map(match => match[1])
}

/**
 * Wire v13 HTML to this invite:
 * - {{first_name}} → first_name (never {{{{first_name}}}})
 * - {{claim_url}} → claim_url on CTA + copy-link only
 * - leftover bare homepage href/text → claim_url
 * - /media and /podcast hrefs stay absolute www paths
 * - cid:george-headshot stays; cid:logo is forbidden
 */
export function applyThanksV12Vars(html: string, vars: Pick<ThanksEmailVars, 'first_name' | 'claim_url'>): string {
  if (html.includes(CID_LOGO)) {
    throw new Error('v13 forbids cid:logo; use the text wordmark')
  }
  if (html.includes('{{{{first_name}}}}') || html.includes('{{George}}')) {
    throw new Error('v13 greeting must be exactly {{first_name}}')
  }

  const first = escapeThanksHtml(vars.first_name)
  const claim = escapeThanksHtml(vars.claim_url)
  const kept = resourceHrefs(html)

  let out = html.replaceAll('{{first_name}}', first)
  out = out.replaceAll('{{claim_url}}', claim)
  out = out.replace(BARE_HOMEPAGE_HREF, `href="${claim}"`)
  out = out.replace(BARE_HOMEPAGE_TEXT, `>${claim}<`)

  if (html.includes(CID_HEADSHOT) && !out.includes(CID_HEADSHOT)) {
    throw new Error('v13 substitution dropped cid:george-headshot')
  }
  if (out.includes(`${THANKS_WWW_ORIGIN}/"`) || /href=["']https:\/\/www\.evolvedpros\.com\/["']/.test(out)) {
    throw new Error('v13 HTML still has a bare www.evolvedpros.com/ CTA')
  }
  if (out.includes('/invite/thanks') && /\/invite\/thanks[^"']*\/(media|podcast)\//.test(out)) {
    throw new Error('v13 substitution prefixed a story/podcast URL with claim_url')
  }
  for (const href of kept) {
    if (!out.includes(`href="${href}"`)) {
      throw new Error(`v13 substitution rewrote resource URL ${href}`)
    }
  }
  return out
}

export function renderThanksV12Html(
  step: ThanksCadenceStep,
  vars: Pick<ThanksEmailVars, 'first_name' | 'claim_url'>,
): string | null {
  const raw = loadThanksV12Html(step)
  if (!raw) return null
  return applyThanksV12Vars(raw, vars)
}

export function landedThanksV12Steps(): ThanksCadenceStep[] {
  return THANKS_CADENCE_STEPS.filter(step => loadThanksV12Html(step))
}

/** Gmail-safe v13 SoT. */
export function thanksV12GmailSafeViolations(html: string): string[] {
  const hits: string[] = []
  if (/\sclass\s*=/i.test(html)) hits.push('css_class')
  if (/<style[\s>]/i.test(html)) hits.push('style_block')
  if (!/<table[\s>]/i.test(html)) hits.push('missing_table')
  if (!/\sstyle\s*=/i.test(html)) hits.push('missing_inline_style')
  if (!html.includes(TEXT_WORDMARK)) hits.push('missing_text_wordmark')
  if (html.includes(CID_LOGO)) hits.push('cid_logo_forbidden')
  if (!html.includes(CID_HEADSHOT)) hits.push('missing_cid_headshot')
  if (!html.includes('{{first_name}}')) hits.push('missing_first_name_token')
  if (html.includes('{{George}}')) hits.push('george_token_forbidden')
  if (html.includes('{{{{first_name}}}}')) hits.push('quad_first_name_token')
  if (!html.includes('{{claim_url}}')) hits.push('missing_claim_url_token')
  if (/href=["']https:\/\/www\.evolvedpros\.com\/["']/.test(html)) hits.push('bare_homepage_cta')
  return hits
}
