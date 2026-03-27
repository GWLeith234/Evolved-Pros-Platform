'use client'

type SponsorAd = {
  id: string
  image_url: string | null
  headline: string | null
  tool_name: string | null
  endorsement_quote: string | null
  special_offer: string | null
  cta_text: string | null
  link_url: string | null
}

interface SponsorCardProps {
  ad: SponsorAd
  variant: 'academy' | 'community' | 'events'
}

export function SponsorCard({ ad, variant }: SponsorCardProps) {
  const ctaText = ad.cta_text || 'Learn More →'

  const inner =
    variant === 'academy' ? (
      <div
        className="relative rounded-lg p-4 flex gap-3"
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          paddingLeft: '16px',
        }}
      >
        {/* Left navy accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '3px',
            backgroundColor: '#1b3c5a',
            borderRadius: '8px 0 0 8px',
          }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className="font-condensed font-bold uppercase tracking-wide mb-1"
            style={{ color: '#68a2b9', fontSize: '9px' }}
          >
            From George&apos;s Stack
          </p>
          {ad.tool_name && (
            <p className="font-condensed font-bold text-white" style={{ fontSize: '14px' }}>
              {ad.tool_name}
            </p>
          )}
          {ad.endorsement_quote && (
            <p
              className="font-body italic mt-1"
              style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}
            >
              &ldquo;{ad.endorsement_quote}&rdquo;
            </p>
          )}
          {ad.special_offer && (
            <span
              className="inline-block font-condensed font-bold uppercase mt-2"
              style={{
                fontSize: '9px',
                color: '#68a2b9',
                backgroundColor: 'rgba(104,162,185,0.15)',
                border: '1px solid #68a2b9',
                borderRadius: '9999px',
                padding: '2px 8px',
              }}
            >
              {ad.special_offer}
            </span>
          )}
          <div className="mt-2">
            <span
              className="font-condensed font-bold uppercase"
              style={{ color: '#68a2b9', fontSize: '11px' }}
            >
              {ctaText}
            </span>
          </div>
        </div>

        {/* Tool logo */}
        {ad.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.image_url}
            alt={ad.tool_name ?? ''}
            style={{
              width: '40px',
              height: '40px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
        )}
      </div>
    ) : variant === 'community' ? (
      <div
        className="relative rounded-lg p-4"
        style={{
          backgroundColor: 'white',
          border: '1px solid rgba(27,60,90,0.1)',
        }}
      >
        {/* Sponsored label top-right */}
        <p
          className="font-condensed uppercase absolute top-3 right-4"
          style={{ color: '#68a2b9', fontSize: '9px' }}
        >
          Sponsored
        </p>

        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            {ad.tool_name && (
              <p
                className="font-condensed font-bold"
                style={{ color: '#1b3c5a', fontSize: '14px' }}
              >
                {ad.tool_name}
              </p>
            )}
            {ad.endorsement_quote && (
              <p
                className="font-body italic mt-1"
                style={{ color: '#7a8a96', fontSize: '12px' }}
              >
                &ldquo;{ad.endorsement_quote}&rdquo;
              </p>
            )}
            {ad.special_offer && (
              <span
                className="inline-block font-condensed font-bold uppercase mt-2"
                style={{
                  fontSize: '9px',
                  color: '#1b3c5a',
                  backgroundColor: 'rgba(27,60,90,0.08)',
                  borderRadius: '9999px',
                  padding: '2px 8px',
                }}
              >
                {ad.special_offer}
              </span>
            )}
            <div className="mt-2">
              <span
                className="font-condensed font-bold uppercase"
                style={{ color: '#1b3c5a', fontSize: '11px' }}
              >
                {ctaText}
              </span>
            </div>
          </div>

          {ad.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.image_url}
              alt={ad.tool_name ?? ''}
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
          )}
        </div>
      </div>
    ) : (
      /* events variant */
      <div
        className="relative rounded-lg p-4"
        style={{
          backgroundColor: 'white',
          border: '1px solid rgba(27,60,90,0.1)',
          paddingLeft: '16px',
        }}
      >
        {/* Left red accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '3px',
            backgroundColor: '#ef0e30',
            borderRadius: '8px 0 0 8px',
          }}
        />

        {/* Sponsored label top-left */}
        <p
          className="font-condensed uppercase mb-2"
          style={{ color: '#68a2b9', fontSize: '9px' }}
        >
          Sponsored
        </p>

        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            {ad.tool_name && (
              <p
                className="font-condensed font-bold"
                style={{ color: '#1b3c5a', fontSize: '16px' }}
              >
                {ad.tool_name}
              </p>
            )}
            {ad.endorsement_quote && (
              <p
                className="font-body italic mt-1"
                style={{ color: '#7a8a96', fontSize: '12px' }}
              >
                &ldquo;{ad.endorsement_quote}&rdquo;
              </p>
            )}
            {ad.special_offer && (
              <span
                className="inline-block font-condensed font-bold uppercase mt-2"
                style={{
                  fontSize: '9px',
                  color: '#1b3c5a',
                  backgroundColor: 'rgba(27,60,90,0.08)',
                  borderRadius: '9999px',
                  padding: '2px 8px',
                }}
              >
                {ad.special_offer}
              </span>
            )}
            <div className="mt-2">
              <span
                className="font-condensed font-bold uppercase"
                style={{ color: '#1b3c5a', fontSize: '11px' }}
              >
                {ctaText}
              </span>
            </div>
          </div>

          {ad.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.image_url}
              alt={ad.tool_name ?? ''}
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'contain',
                flexShrink: 0,
              }}
            />
          )}
        </div>
      </div>
    )

  if (ad.link_url) {
    return (
      <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    )
  }

  return <div>{inner}</div>
}
