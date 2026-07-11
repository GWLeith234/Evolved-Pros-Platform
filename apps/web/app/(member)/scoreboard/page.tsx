import { redirect } from 'next/navigation'

// Goals + accountability were consolidated into the Home daily dashboard
// ("Today's Evolution"). Keep this route as a permanent redirect so old links,
// bookmarks, and the previous "Goals" nav target still land somewhere useful.
export default function ScoreboardRedirect() {
  redirect('/home#today')
}
