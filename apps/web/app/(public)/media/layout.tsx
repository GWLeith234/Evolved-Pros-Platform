export default function MediaLayout({ children }: { children: React.ReactNode }) {
  // SPRINT N — THEME DECISION: /media is a standalone cream/light editorial
  // magazine shell, intentionally locked to light (colorScheme: 'light' below)
  // and NOT wired to the app light/dark toggle. It is out of scope for the
  // member/admin light-dark work by design.
  //
  // The media sub-app routinely sets large clamp() type sizes and 1280-px
  // editorial rails. On a 390-px viewport that bleeds into the body and
  // hands QA the 570-px scrollWidth they keep flagging. Containing overflow
  // here means every /media/* route inherits the fix without each child
  // having to remember.
  return (
    <div
      className="min-h-screen bg-[#F5F0E8] text-[#374151]"
      style={{ maxWidth: '100vw', overflowX: 'hidden', color: '#374151', colorScheme: 'light' }}
    >
      {children}
    </div>
  )
}
