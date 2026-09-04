'use client'

import { usePathname } from 'next/navigation'
import { PublicFooter } from '@/components/layout/PublicFooter'

/**
 * `/` owns a legal-only footer. Keep the global public footer off that
 * document so Join free / LIVE / Contact (and the old em-dash aria) never
 * appear in the homepage DOM.
 */
export function ConversionFooterGate() {
  const pathname = usePathname()
  if (pathname === '/') return null
  return <PublicFooter />
}
