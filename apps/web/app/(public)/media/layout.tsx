import { Masthead } from '@/components/media/Masthead'

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  // Parchment masthead + desk. #150 Media lockup (navy letters on paper).
  // No navy island. Overflow is clipped here so every /media/* route
  // inherits the mobile scrollWidth fix.
  return (
    <div className="min-h-screen bg-paper text-navy ep-no-x-scroll" style={{ maxWidth: '100vw' }}>
      <Masthead />
      <div className="media-desk-shell">{children}</div>
    </div>
  )
}
