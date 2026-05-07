import { ThemeBridge } from '@/components/media/ThemeBridge'

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  // The media sub-app routinely sets large clamp() type sizes and 1280-px
  // editorial rails. On a 390-px viewport that bleeds into the body and
  // hands QA the 570-px scrollWidth they keep flagging. Containing overflow
  // here means every /media/* route inherits the fix without each child
  // having to remember.
  return (
    <div style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      <ThemeBridge />
      {children}
    </div>
  )
}
