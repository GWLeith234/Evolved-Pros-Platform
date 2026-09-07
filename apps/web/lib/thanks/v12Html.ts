import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { THANKS_CADENCE_STEPS, THANKS_WWW_ORIGIN, type ThanksCadenceStep } from './constants'
import type { ThanksEmailVars } from './copy'

/**
 * send-ready-v12 Creative SoT: Gmail-safe HTML only.
 * TABLES + INLINE STYLES. Do not use CSS classes (v11 class CSS failed in Gmail).
 * Logo + headshot stay CID: cid:logo and cid:george-headshot.
 * Sender substitutes {{George}} → first_name and bare www CTA/copy-link → claim_url.
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

/** Bare www origin used as CTA / copy-link. Do not eat /podcast/… paths. */
const BARE_WWW_ORIGIN = /https:\/\/www\.evolvedpros\.com\/?(?=["'\s<>]|$)/gi

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

export function loadThanksV12CidAttachments(): ThanksCidAttachment[] {
  const dir = resolveThanksV12Dir()
  if (!dir) return []
  const assets = join(dir, 'assets')
  const out: ThanksCidAttachment[] = []
  const logo = readFirstExisting(assets, ['logo.png', 'logo.jpg', 'logo.jpeg', 'logo.gif', 'logo.webp'])
  if (logo) {
    out.push({ ...logo, content_id: 'logo', contentId: 'logo' })
  }
  const head = readFirstExisting(assets, [
    'george-headshot.jpg',
    'george-headshot.jpeg',
    'george-headshot.png',
    'george-headshot.webp',
  ])
  if (head) {
    out.push({ ...head, content_id: 'george-headshot', contentId: 'george-headshot' })
  }
  return out
}

/**
 * Wire send-ready-v12 HTML to this invite:
 * - {{George}} / {{first_name}} → first_name
 * - {{claim_url}} and bare https://www.evolvedpros.com/ CTA + copy-link → claim_url
 * - cid:logo and cid:george-headshot stay untouched
 */
export function applyThanksV12Vars(html: string, vars: Pick<ThanksEmailVars, 'first_name' | 'claim_url'>): string {
  const first = escapeThanksHtml(vars.first_name)
  const claim = escapeThanksHtml(vars.claim_url)
  let out = html.replaceAll('{{George}}', first)
  out = out.replaceAll('{{first_name}}', first)
  out = out.replaceAll('{{claim_url}}', claim)
  out = out.replace(BARE_WWW_ORIGIN, claim)

  if (!out.includes(CID_LOGO) && html.includes(CID_LOGO)) {
    throw new Error('v12 substitution dropped cid:logo')
  }
  if (!out.includes(CID_HEADSHOT) && html.includes(CID_HEADSHOT)) {
    throw new Error('v12 substitution dropped cid:george-headshot')
  }
  if (out.includes(`${THANKS_WWW_ORIGIN}/"`) || /href=["']https:\/\/www\.evolvedpros\.com\/["']/.test(out)) {
    // Bare origin CTA survived. Fail closed so we never send a homepage link.
    throw new Error('v12 HTML still has a bare www.evolvedpros.com/ CTA')
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

/** Gmail-safe SoT. v11 class CSS failed in Gmail. */
export function thanksV12GmailSafeViolations(html: string): string[] {
  const hits: string[] = []
  if (/\sclass\s*=/i.test(html)) hits.push('css_class')
  if (/<style[\s>]/i.test(html)) hits.push('style_block')
  if (!/<table[\s>]/i.test(html)) hits.push('missing_table')
  if (!/\sstyle\s*=/i.test(html)) hits.push('missing_inline_style')
  if (!html.includes(CID_LOGO)) hits.push('missing_cid_logo')
  if (!html.includes(CID_HEADSHOT)) hits.push('missing_cid_headshot')
  if (/<img[^>]+src=["']https?:/i.test(html) && /alt=["'][^"']*EVOLVED/i.test(html)) {
    if (!/src=["']cid:logo["']/.test(html)) hits.push('remote_logo')
  }
  return hits
}
