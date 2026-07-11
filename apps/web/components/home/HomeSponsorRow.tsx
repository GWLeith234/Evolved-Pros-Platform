// Re-export pure server-safe row from HomeSponsorAd for stable import paths.
// Prefer passing SSR-fetched ads: <HomeSponsorRow ads={...} />.
export { HomeSponsorRow, HomeSponsorAd } from './HomeSponsorAd'
