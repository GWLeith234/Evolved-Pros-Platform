// Override the (member) layout for /live so the page renders without
// the platform TopNav / RightRail / BottomTabBar chrome — gives the
// keynote/booking surface a clean editorial layout. The "← Platform"
// overlay added in UX-4 is the only navigation back to /home.
//
// All other (member) routes are unaffected — Next.js applies the
// closest layout.tsx in the route tree, so this only intercepts /live.

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
