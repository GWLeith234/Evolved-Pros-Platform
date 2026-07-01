// Academy now respects the global theme toggle. Its own components are still
// hardcoded dark-only (not migrated to tokens in this sprint), so light mode
// will look rough here until a later pass — expected, not a regression.
export default function AcademyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
