'use client'

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' fill='%23111926'%3E%3Crect width='40' height='40'/%3E%3C/svg%3E"

export function EpisodeThumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-10 h-10 rounded object-cover flex-shrink-0"
      onError={e => { e.currentTarget.src = PLACEHOLDER }}
    />
  )
}
