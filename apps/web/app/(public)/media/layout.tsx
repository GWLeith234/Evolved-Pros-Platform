import { Masthead } from '@/components/media/Masthead'
import { MEDIA_MEGAPHONE_DISC } from '@/lib/lockups'

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  // Theme-aware desk. Light uses cream paper. Dark uses platform page tokens.
  // Overflow is clipped here so every /media/* route inherits the mobile
  // scrollWidth fix. Preload the megaphone disc used in the Media lockup.
  return (
    <div className="min-h-screen media-desk-root ep-no-x-scroll" style={{ maxWidth: '100vw' }}>
      <link rel="preload" as="image" href={MEDIA_MEGAPHONE_DISC} {...{ fetchpriority: 'high' }} />
      <Masthead />
      <div className="media-desk-shell">{children}</div>
    </div>
  )
}
