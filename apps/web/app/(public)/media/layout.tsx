import { Masthead } from '@/components/media/Masthead'
import { MEDIA_LOCKUP_DARK, MEDIA_LOCKUP_LIGHT } from '@/lib/lockups'
import { getMediaIndexSections } from '@/lib/media/public'

// SPRINT M - the layout is where the section rail gets its data: one cached
// query per five minutes for every /media/* response, resolved here so the
// masthead itself stays a plain presentational component.
export default async function MediaLayout({ children }: { children: React.ReactNode }) {
  const sections = await getMediaIndexSections()
  // Theme-aware desk. Light uses cream paper. Dark uses platform page tokens.
  // Overflow is clipped here so every /media/* route inherits the mobile
  // scrollWidth fix. Preload both theme lockup PNGs (no megaphone-disc).
  return (
    <div className="min-h-screen media-desk-root ep-no-x-scroll" style={{ maxWidth: '100vw' }}>
      <link rel="preload" as="image" href={MEDIA_LOCKUP_DARK} {...{ fetchpriority: 'high' }} />
      <link rel="preload" as="image" href={MEDIA_LOCKUP_LIGHT} />
      <Masthead sections={sections} />
      <div className="media-desk-shell">{children}</div>
    </div>
  )
}
