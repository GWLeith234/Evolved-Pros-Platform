import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// /scoreboard 404'd because no route existed, but the home widget and
// Pillar 5 (Accountability) copy both reference "the scoreboard". The
// canonical accountability surface is /academy/accountability — send
// people there rather than maintaining a parallel page.
export default function ScoreboardPage() {
  redirect('/academy/accountability')
}
