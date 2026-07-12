/**
 * /dev/components — Component library isolation preview (Storybook-style).
 * Protected by middleware; only accessible when authenticated.
 *
 * Definition of Done (Sprint 1):
 *  - Design tokens (colors, type, spacing, shadows, radii)
 *  - Buttons (primary / secondary / pill / success / ghost)
 *  - Metric & progress (StatCard, ProgressCircle, ProgressBar, AchievementBanner)
 *  - Dark + light toggle works
 */

import { DevComponentsClient } from './DevComponentsClient'

export const metadata = {
  title: 'Component Library — Evolved Pros',
  robots: { index: false, follow: false },
}

export default function ComponentsPage() {
  return <DevComponentsClient />
}
