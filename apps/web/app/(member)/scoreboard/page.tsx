import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// /scoreboard 404'd because the accountability leaderboard lives at
// /academy/accountability. The home page WelcomeBanner widget points at
// /scoreboard, so redirect there.
export default function ScoreboardPage() {
  redirect('/academy/accountability')
}
