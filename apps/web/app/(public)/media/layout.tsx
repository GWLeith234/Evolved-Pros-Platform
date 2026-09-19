import { Masthead } from '@/components/media/Masthead'
import { MEDIA_LOCKUP_DARK, MEDIA_LOCKUP_LIGHT } from '@/lib/lockups'

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  // Theme-aware desk. Light uses cream paper. Dark uses platform page tokens.
  // Overflow is clipped here so every /media/* route inherits the mobile
  // scrollWidth fix. Preload both theme lockup PNGs (no megaphone-disc).
  return (
    <div className="min-h-screen media-desk-root ep-no-x-scroll" style={{ maxWidth: '100vw' }}>
      <link rel="preload" as="image" href={MEDIA_LOCKUP_DARK} {...{ fetchpriority: 'high' }} />
      <link rel="preload" as="image" href={MEDIA_LOCKUP_LIGHT} />
      <Masthead />
      <div className="media-desk-shell">{children}</div>
    </div>
  )
}
