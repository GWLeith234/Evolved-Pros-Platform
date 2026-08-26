/**
 * Public marketing / editorial routes (/, /media, /podcast, /pricing, …).
 *
 * New pages in this tree must call `publicPageMetadata(path, { title, … })`
 * from `@/lib/seo/canonical` so they emit rel=canonical + og:url on the www
 * host. Do not hardcode platform.evolvedpros.com. The root layout sets
 * metadataBase to www; this layout does not guess a path (a wrong homepage
 * canonical is how /media shipped with og:url pointing at /).
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
