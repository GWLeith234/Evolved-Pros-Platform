import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { reportScope, type ReportSlug } from './paths'

const SHELL_FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'icon.svg', 'icon-192.png', 'icon-512.png'] as const

export function weeklyReportsRoot(): string | null {
  const candidates = [
    path.join(process.cwd(), 'weekly-reports'),
    path.join(process.cwd(), 'apps/web/weekly-reports'),
  ]
  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'adcellerant', 'index.html'))) return candidate
  }
  return null
}

function shellFile(slug: ReportSlug, name: string): string | null {
  const root = weeklyReportsRoot()
  if (!root) return null
  if (!SHELL_FILES.includes(name as (typeof SHELL_FILES)[number]) && !name.endsWith('.shape.json')) {
    return null
  }
  const full = path.resolve(root, slug, name)
  const allowed = path.resolve(root, slug) + path.sep
  if (!full.startsWith(allowed)) return null
  if (!existsSync(full)) return null
  return full
}

export function readShellText(slug: ReportSlug, name: string): string | null {
  const full = shellFile(slug, name)
  if (!full) return null
  return readFileSync(full, 'utf8')
}

export function readShellBytes(slug: ReportSlug, name: string): Buffer | null {
  const full = shellFile(slug, name)
  if (!full) return null
  return readFileSync(full)
}

export function readShapeFixture(slug: ReportSlug): unknown | null {
  const root = weeklyReportsRoot()
  if (!root) return null
  const full = path.resolve(root, 'fixtures', `${slug}.shape.json`)
  const fixtures = path.resolve(root, 'fixtures') + path.sep
  if (!full.startsWith(fixtures) || !existsSync(full)) return null
  return JSON.parse(readFileSync(full, 'utf8')) as unknown
}

export function rewriteShellHtml(html: string, slug: ReportSlug, example: boolean): string {
  const base = reportScope(slug)
  let next = html
  if (!next.includes('<base ')) {
    next = next.replace('<head>', `<head>\n<base href="${base}">`)
  }
  next = next.replaceAll("fetch('report.json", `fetch('${base}report.json`)
  next = next.replaceAll('fetch("report.json', `fetch("${base}report.json`)
  next = next.replace(
    "navigator.serviceWorker.register('./sw.js')",
    `navigator.serviceWorker.register('${base}sw.js',{scope:'${base}'})`,
  )
  if (example && !next.includes('EXAMPLE DATA')) {
    next = next.replace(
      '<body>',
      '<body>\n<div class="banner">EXAMPLE DATA <b>not a real report</b></div>',
    )
  }
  return next
}

export function rewriteManifest(raw: string, slug: ReportSlug): string {
  const manifest = JSON.parse(raw) as {
    start_url?: string
    scope?: string
    display?: string
    icons?: { src?: string }[]
  }
  const base = reportScope(slug)
  manifest.start_url = base
  manifest.scope = base
  manifest.display = 'standalone'
  for (const icon of manifest.icons ?? []) {
    if (typeof icon.src === 'string') {
      const file = icon.src.split('/').pop()
      icon.src = base + file
    }
  }
  return JSON.stringify(manifest)
}

export function weeklyReportsIndexHtml(example: boolean): string {
  const banner = example
    ? '<p class="ex">EXAMPLE DATA. Not a real report.</p>'
    : ''
  const links = [
    ['adcellerant', 'AdCellerant Weekly'],
    ['evolved-pros', 'Evolved Pros Weekly'],
    ['evolvex360', 'EvolveX360 Weekly'],
    ['gwleith-money', 'GWLeith $ Weekly'],
  ]
    .map(
      ([slug, name]) =>
        `<a href="/admin/reports/${slug}/"><strong>${name}</strong><span>Open</span></a>`,
    )
    .join('\n')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Weekly reports</title>
<style>
  body { margin: 0; font-family: -apple-system, "Segoe UI", sans-serif; background: #f4f6f9; color: #12324a; }
  .ex { margin: 0; background: #194766; color: #fff; text-align: center; font: 700 12px/1.2 -apple-system, sans-serif; letter-spacing: .06em; text-transform: uppercase; padding: 10px 12px; }
  main { max-width: 40rem; margin: 0 auto; padding: 28px 20px 48px; }
  h1 { font-size: 28px; line-height: 1.15; margin: 0 0 8px; }
  p.lead { margin: 0 0 18px; color: #33475b; font-size: 15px; }
  a { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px; margin: 0 0 12px; padding: 14px 16px; background: #fff; border: 1px solid #e1e7ee; border-radius: 14px; color: inherit; text-decoration: none; }
  a span { font-size: 13px; font-weight: 700; color: #194766; }
</style>
</head>
<body>
${banner}
<main>
  <h1>Weekly reports</h1>
  <p class="lead">Four private reports. Each one installs on its own.</p>
  ${links}
</main>
</body>
</html>`
}
