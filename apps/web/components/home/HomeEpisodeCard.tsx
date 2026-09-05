import Link from 'next/link'
import { formatEpisode } from '@/lib/format'

export interface HomeEpisodeCardProps {
  href: string
  title: string
  guestName: string | null
  episodeNumber: number | null
  /** Resolved guest still (guest_image_url first). Never a blocked thumbnail. */
  guestImageUrl: string | null
}

/**
 * Latest-episode card for member Home. Prefers the guest still over a
 * wrong show thumbnail so the face on the card matches the guest.
 */
export function HomeEpisodeCard({
  href,
  title,
  guestName,
  episodeNumber,
  guestImageUrl,
}: HomeEpisodeCardProps) {
  const epLabel = formatEpisode(episodeNumber)
  return (
    <li style={{ minWidth: 0 }}>
      <Link
        href={href}
        className="flex flex-col h-full no-underline overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: '16 / 9', background: 'var(--bg-elevated)' }}
        >
          {guestImageUrl ? (
            // Guest stills may be local public paths or allowed CDN URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={guestImageUrl}
              alt={guestName ? `${guestName}` : title}
              width={640}
              height={360}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="font-bebas text-[28px] tracking-[0.04em] text-tertiary">
                {epLabel || 'EP'}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5" style={{ padding: 'var(--space-4)' }}>
          {epLabel && (
            <span className="font-condensed text-ep-label font-bold uppercase tracking-[0.16em] text-tertiary">
              {epLabel}
            </span>
          )}
          <span className="font-condensed text-[16px] font-bold leading-snug text-primary">
            {title}
          </span>
          {guestName && (
            <span className="font-body text-[13px] text-tertiary">{guestName}</span>
          )}
        </div>
      </Link>
    </li>
  )
}
