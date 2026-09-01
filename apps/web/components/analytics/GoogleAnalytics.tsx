'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Official Next.js App Router pattern: `next/script` + gtag.js.
 * Initial page_view comes from `gtag('config', …)`. Client navigations
 * send a follow-up config so App Router transitions are counted.
 */
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const skipFirstNavigation = useRef(true)

  useEffect(() => {
    if (skipFirstNavigation.current) {
      skipFirstNavigation.current = false
      return
    }
    if (typeof window.gtag !== 'function') return
    const query = searchParams.toString()
    const pagePath = query ? `${pathname}?${query}` : pathname
    window.gtag('config', measurementId, { page_path: pagePath })
  }, [pathname, searchParams, measurementId])

  const idLiteral = JSON.stringify(measurementId)

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', ${idLiteral});
        `}
      </Script>
    </>
  )
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}
