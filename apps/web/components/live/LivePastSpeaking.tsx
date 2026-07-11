import { SPEAKING_PINS } from '@/lib/live/speaking-pins'
import { LiveSectionHeader } from './LiveSectionHeader'

const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'

/**
 * Past speaking cities — consolidated from the tour pin map for the LIVE page.
 * Cities are the primary label as requested for speaking history.
 */
export function LivePastSpeaking() {
  // Group by country for a scannable archive
  const byCountry = new Map<string, string[]>()
  for (const pin of SPEAKING_PINS) {
    const list = byCountry.get(pin.country) ?? []
    if (!list.includes(pin.city)) list.push(pin.city)
    byCountry.set(pin.country, list)
  }
  const countries = Array.from(byCountry.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )

  return (
    <section style={{ maxWidth: 1280, margin: '64px auto 0', padding: '0 24px' }}>
      <LiveSectionHeader
        eyebrow="The Archive"
        title="Past speaking events"
        kicker="Stages George has stood on — city by city."
      />
      <div
        style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        {countries.map(([country, cities]) => (
          <div
            key={country}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color, var(--border-soft2))',
              padding: '16px 16px 14px',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: FBC,
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--brand-gold, #C9A84C)',
              }}
            >
              {country}
            </p>
            <ul
              style={{
                listStyle: 'none',
                margin: '10px 0 0',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              {cities.sort().map(city => (
                <li
                  key={city}
                  style={{
                    fontFamily: FBN,
                    fontSize: 18,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    color: 'var(--text-primary, var(--text-strong))',
                    lineHeight: 1.2,
                  }}
                >
                  {city}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
