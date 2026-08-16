import { PodcastChrome } from '@/components/podcast/PodcastChrome'

/**
 * Static public podcast layout — no cookies/headers so child pages can ISR.
 * Logged-in members get chrome via PodcastChrome's client upgrade island.
 */
export default function PodcastLayout({ children }: { children: React.ReactNode }) {
  return <PodcastChrome>{children}</PodcastChrome>
}
