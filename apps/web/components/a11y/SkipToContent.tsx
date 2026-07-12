/**
 * Skip link — first focusable control for keyboard users.
 * Targets #main-content on the member shell.
 */
export function SkipToContent({ targetId = 'main-content' }: { targetId?: string }) {
  return (
    <a href={`#${targetId}`} className="ep-skip-link">
      Skip to main content
    </a>
  )
}
