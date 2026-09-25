/** How og:image, title, and description read as a social card. */

export function MediaSocialCard({
  title,
  description,
  image,
  imageAlt,
}: {
  title: string
  description: string
  image: string
  imageAlt: string
}) {
  const rows = [
    ['og:title', title],
    ['og:description', description],
    ['og:image', image],
    ['og:type', 'article'],
    ['twitter:card', 'summary_large_image'],
  ] as const

  return (
    <div className="ep-social-card-wrap">
      <article className="ep-social-card" aria-label="Social card preview">
        <div className="ep-social-card-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={imageAlt} width={1200} height={630} />
        </div>
        <div className="ep-social-card-copy">
          <p className="ep-social-card-domain">evolvedpros.com</p>
          <p className="ep-social-card-title">{title}</p>
          {description ? <p>{description}</p> : null}
        </div>
      </article>
      <dl className="ep-social-card-meta">
        {rows.map(([name, value]) => (
          <div key={name}>
            <dt>{name}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
