/**
 * Poster for a locked or logged-out Fit card.
 * posterUrl is a signed Mux thumbnail (image only). A missing poster
 * keeps the shared play icon. This component never receives a playback
 * token or a video URL.
 *
 * PR 199 adds FitLibraryCard in FitLibrary.tsx. That locked branch should
 * render this component with move.posterUrl. Keep that edit to this one
 * element so the two changes stay easy to merge.
 */
export function FitLockedPoster({
  posterUrl,
}: {
  posterUrl?: string | null
}) {
  if (!posterUrl) return <span className="ep-fit-play" />
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="ep-fit-poster" src={posterUrl} alt="" />
  )
}
