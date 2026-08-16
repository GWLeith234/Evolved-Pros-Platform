import { SPEAKING_PINS, SPEAKING_STATS } from '@/lib/live/speaking-pins'
import { LiveSectionHeader } from './LiveSectionHeader'

const FB = 'Barlow, sans-serif'
const FBC = 'Barlow Condensed, sans-serif'
const FBN = 'Bebas Neue, sans-serif'

/** Macro-regions for a scannable archive (not 1 card per country). */
const REGION_ORDER = [
  'North America',
  'Europe',
  'Asia-Pacific',
  'Africa',
] as const

type Region = (typeof REGION_ORDER)[number]

function countryRegion(country: string): Region {
  switch (country) {
    case 'USA':
    case 'Canada':
      return 'North America'
    case 'Australia':
    case 'Indonesia':
    case 'Malaysia':
    case 'Hong Kong':
    case 'China':
    case 'Thailand':
      return 'Asia-Pacific'
    case 'South Africa':
      return 'Africa'
    default:
      return 'Europe'
  }
}

function sortCities(cities: string[]): string[] {
  return [...cities].sort((a, b) => a.localeCompare(b))
}

/**
 * Past stages as cities only — same pin set as the globe above.
 * No event write-ups; when a date passes, the city stays on the map + here.
 */
export function LivePastSpeaking() {
  const byCountry = new Map<string, string[]>()
  for (const pin of SPEAKING_PINS) {
    const list = byCountry.get(pin.country) ?? []
    if (!list.includes(pin.city)) list.push(pin.city)
    byCountry.set(pin.country, list)
  }

  const byRegion = new Map<Region, { country: string; cities: string[] }[]>()
  for (const r of REGION_ORDER) byRegion.set(r, [])
  for (const [country, cities] of byCountry) {
    const region = countryRegion(country)
    byRegion.get(region)!.push({ country, cities: sortCities(cities) })
  }
  for (const rows of byRegion.values()) {
    rows.sort((a, b) => b.cities.length - a.cities.length || a.country.localeCompare(b.country))
  }

  const totalCities = SPEAKING_STATS.cities
  const totalCountries = SPEAKING_STATS.countries

  return (
    <section className="live-section-pad" style={{ margin: '48px auto 0' }}>
      <LiveSectionHeader
        eyebrow="The Archive"
        title="Cities on the tour"
        kicker={`${totalCities} cities · ${totalCountries} countries — every name is a pin on the map above.`}
      />

      <div
        style={{
          marginTop: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {REGION_ORDER.map(region => {
          const rows = byRegion.get(region) ?? []
          if (!rows.length) return null
          const cityCount = rows.reduce((n, r) => n + r.cities.length, 0)

          return (
            <div
              key={region}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color, var(--border-soft2))',
                borderLeft: '3px solid var(--brand-gold, #C9A84C)',
                padding: '18px 20px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 12,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontFamily: FBN,
                    fontSize: 22,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-primary, var(--text-strong))',
                  }}
                >
                  {region}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontFamily: FBC,
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--text-3, rgba(255,255,255,0.55))',
                  }}
                >
                  {rows.length} {rows.length === 1 ? 'country' : 'countries'} · {cityCount} cities
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {rows.map(({ country, cities }) => (
                  <div key={country}>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: FBC,
                        fontWeight: 800,
                        fontSize: 11,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'var(--brand-gold, #C9A84C)',
                      }}
                    >
                      {country}
                      <span
                        style={{
                          marginLeft: 8,
                          fontWeight: 600,
                          color: 'var(--text-3, rgba(255,255,255,0.55))',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {cities.length}
                      </span>
                    </p>
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontFamily: FB,
                        fontSize: 15,
                        lineHeight: 1.55,
                        color: 'var(--text-2, rgba(255,255,255,0.78))',
                      }}
                    >
                      {cities.join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
