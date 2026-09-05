import { Masthead } from '@/components/media/Masthead'

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  // Centered EVOLVED PROS [megaphone] MEDIA lockup follows the app theme.
  // The desk body stays on paper so the SooToday hub and article shells from
  // #108 keep readable navy-on-cream type. Overflow is clipped here so every
  // /media/* route inherits the mobile scrollWidth fix.
  return (
    <div className="min-h-screen bg-page text-primary ep-no-x-scroll" style={{ maxWidth: '100vw' }}>
      <Masthead />
      <div className="media-desk-shell">{children}</div>
    </div>
  )
}
