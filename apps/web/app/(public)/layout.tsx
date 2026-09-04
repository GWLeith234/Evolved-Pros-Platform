import { ConversionFooterGate } from '@/components/layout/ConversionFooterGate'

/**
 * Public marketing / editorial routes (/, /media, /podcast, /pricing, …).
 *
 * New pages in this tree must call `publicPageMetadata(path, { title, … })`
 * from `@/lib/seo/canonical` so they emit rel=canonical + og:url on the www
 * host. Do not hardcode platform.evolvedpros.com. The root layout sets
 * metadataBase to www; this layout does not guess a path (a wrong homepage
 * canonical is how /media shipped with og:url pointing at /).
 *
 * SPRINT FOOTER-1 — this is the single mount point for the global public
 * footer, so every route in the tree inherits it except `/`, which owns a
 * legal-only footer. Routes OUTSIDE this group (/live, /login,
 * app/not-found.tsx) mount <PublicFooter /> themselves.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ep-public-shell">
      <div className="ep-public-shell-main">{children}</div>
      <ConversionFooterGate />
    </div>
  )
}
