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

/**
 * Prefer major hubs when collapsing long US/Canada lists — still show every
 * city, but as a single flowing line rather than a tall bullet stack.
 */
function sortCities(cities: string[]): string[] {
  return [...cities].sort((a, b) => a.localeCompare(b))
}

/**
 * Past speaking archive — consolidated by region so the LIVE page stays
 * scannable (was ~20 country cards with 100+ USA city bullets).
 */
export function LivePastSpeaking() {
  // country → unique cities
  const byCountry = new Map<string, string[]>()
  for (const pin of SPEAKING_PINS) {
    const list = byCountry.get(pin.country) ?? []
    if (!list.includes(pin.city)) list.push(pin.city)
    byCountry.set(pin.country, list)
  }

  // region → { country, cities }[]
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
    <section style={{ maxWidth: 1280, margin: '64px auto 0', padding: '0 24px' }}>
      <LiveSectionHeader
        eyebrow="The Archive"
        title="Past speaking events"
        kicker={`${totalCities}+ cities · ${totalCountries} countries · ${SPEAKING_STATS.talks}+ stages. Consolidated by region.`}
      />

      {/* Stat strip */}
      <div
        style={{
          marginTop: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 1,
          background: 'var(--border-color, var(--border-soft2))',
          border: '1px solid var(--border-color, var(--border-soft2))',
        }}
      >
        {[
          { label: 'Talks', value: `${SPEAKING_STATS.talks}+` },
          { label: 'Cities', value: `${totalCities}` },
          { label: 'Countries', value: `${totalCountries}` },
          { label: 'Years', value: `${SPEAKING_STATS.yearsActive}` },
        ].map(s => (
          <div
            key={s.label}
            style={{
              background: 'var(--bg-surface)',
              padding: '14px 16px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: FBN,
                fontSize: 28,
                letterSpacing: '0.04em',
                color: 'var(--brand-gold, #C9A84C)',
                lineHeight: 1,
              }}
            >
              {s.value}
            </p>
            <p
              style={{
                margin: '6px 0 0',
                fontFamily: FBC,
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary, rgba(255,255,255,0.4))',
              }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Regional blocks */}
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
                    color: 'var(--text-tertiary, rgba(255,255,255,0.4))',
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
                          color: 'var(--text-tertiary, rgba(255,255,255,0.35))',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {cities.length}
                      </span>
                    </p>
                    {/* Single flowing line — much denser than one li per city */}
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontFamily: FB,
                        fontSize: 14,
                        lineHeight: 1.55,
                        color: 'var(--text-secondary, rgba(255,255,255,0.65))',
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
