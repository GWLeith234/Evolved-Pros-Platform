import { NextResponse } from 'next/server'
import { callerIsAllowlisted, loadReportCaller, readWeeklyPayload } from '@/lib/reports/access'
import { anonymousWeeklyReportResponse, weeklyReportNotFound } from '@/lib/reports/http'
import {
  isWeeklyReportPath,
  parseReportPath,
  PRIVATE_NO_STORE,
  reportScope,
  shapeFixtureEnabled,
} from '@/lib/reports/paths'
import {
  readShellBytes,
  readShellText,
  rewriteManifest,
  rewriteShellHtml,
  weeklyReportsIndexHtml,
} from './shell'

const ICON_TYPES: Record<string, string> = {
  'icon.svg': 'image/svg+xml',
  'icon-192.png': 'image/png',
  'icon-512.png': 'image/png',
}

function html(body: string): NextResponse {
  return new NextResponse(body, {
    status: 200,
    headers: {
      ...PRIVATE_NO_STORE,
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

export async function serveWeeklyReport(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const pathname = url.pathname
  if (!isWeeklyReportPath(pathname)) return weeklyReportNotFound()

  const caller = await loadReportCaller()
  if (!caller) return anonymousWeeklyReportResponse(request.url, pathname)

  const allowed = await callerIsAllowlisted(caller.ids)
  if (!allowed) return weeklyReportNotFound()

  const parsed = parseReportPath(pathname)
  if (parsed.kind === 'unknown') return weeklyReportNotFound()

  if (
    parsed.kind === 'shell' &&
    !parsed.trailingSlash &&
    !pathname.endsWith('/index.html')
  ) {
    const dest = new URL(`${reportScope(parsed.slug)}${url.search}`, request.url)
    const res = NextResponse.redirect(dest, 307)
    for (const [key, value] of Object.entries(PRIVATE_NO_STORE)) res.headers.set(key, value)
    return res
  }

  if (parsed.kind === 'index') {
    return html(weeklyReportsIndexHtml(shapeFixtureEnabled()))
  }

  if (parsed.kind === 'shell') {
    const raw = readShellText(parsed.slug, 'index.html')
    if (raw == null) return weeklyReportNotFound()
    return html(rewriteShellHtml(raw, parsed.slug, shapeFixtureEnabled()))
  }

  if (parsed.kind === 'manifest') {
    const raw = readShellText(parsed.slug, 'manifest.webmanifest')
    if (raw == null) return weeklyReportNotFound()
    return new NextResponse(rewriteManifest(raw, parsed.slug), {
      status: 200,
      headers: {
        ...PRIVATE_NO_STORE,
        'Content-Type': 'application/manifest+json; charset=utf-8',
      },
    })
  }

  if (parsed.kind === 'worker') {
    const raw = readShellText(parsed.slug, 'sw.js')
    if (raw == null) return weeklyReportNotFound()
    return new NextResponse(raw, {
      status: 200,
      headers: {
        ...PRIVATE_NO_STORE,
        'Content-Type': 'application/javascript; charset=utf-8',
        'Service-Worker-Allowed': reportScope(parsed.slug),
      },
    })
  }

  if (parsed.kind === 'icon') {
    const bytes = readShellBytes(parsed.slug, parsed.file)
    if (bytes == null) return weeklyReportNotFound()
    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        ...PRIVATE_NO_STORE,
        'Content-Type': ICON_TYPES[parsed.file] ?? 'application/octet-stream',
      },
    })
  }

  const payload = await readWeeklyPayload(parsed.slug)
  if (payload == null) return weeklyReportNotFound()
  return new NextResponse(JSON.stringify(payload), {
    status: 200,
    headers: {
      ...PRIVATE_NO_STORE,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}
