import { NextResponse } from 'next/server'
import { loginHrefFor } from '@/lib/auth/gatedIntent'
import { anonymousDisposition, PRIVATE_NO_STORE } from './paths'

function applyPrivate(headers: Headers): void {
  for (const [key, value] of Object.entries(PRIVATE_NO_STORE)) {
    headers.set(key, value)
  }
}

/** Logged-out response. Pages go to login. JSON, the manifest, the worker, and icons are 401. */
export function anonymousWeeklyReportResponse(requestUrl: string, pathname: string): NextResponse {
  if (anonymousDisposition(pathname) === 401) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: PRIVATE_NO_STORE },
    )
  }
  const login = new URL(loginHrefFor(pathname), requestUrl)
  const res = NextResponse.redirect(login)
  applyPrivate(res.headers)
  return res
}

export function weeklyReportNotFound(): NextResponse {
  return new NextResponse('<!doctype html><title>Not found</title><p>Not found</p>', {
    status: 404,
    headers: {
      ...PRIVATE_NO_STORE,
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
