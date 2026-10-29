'use client'

import { usePathname } from 'next/navigation'
import { PublicFooter } from '@/components/layout/PublicFooter'

/**
 * `/` uses the same site footer as the rest of the public shell.
 * `/fit` keeps its own shell and does not mount this footer.
 */
export function ConversionFooterGate() {
  const pathname = usePathname()
  if (pathname === '/fit') return null
  return <PublicFooter />
}
