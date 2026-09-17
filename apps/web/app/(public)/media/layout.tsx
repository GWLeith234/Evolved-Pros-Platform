import { Masthead } from '@/components/media/Masthead'
import { MEDIA_LOCKUP_LIGHT } from '@/lib/lockups'

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  // Parchment masthead + desk. #150 Media lockup spans the content width
  // (navy letters on paper). No navy island. Overflow is clipped here so
  // every /media/* route inherits the mobile scrollWidth fix.
  // Preload the visible parchment lockup so LCP does not wait on desk JS.
  return (
    <div className="min-h-screen bg-paper text-navy ep-no-x-scroll" style={{ maxWidth: '100vw' }}>
      <link rel="preload" as="image" href={MEDIA_LOCKUP_LIGHT} {...{ fetchpriority: 'high' }} />
      <Masthead />
      <div className="media-desk-shell">{children}</div>
    </div>
  )
}
