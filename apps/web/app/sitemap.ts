import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://platform.evolvedpros.com'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/community`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/events`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/academy`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/podcast`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/live`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/media`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/leaderboard`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.6 },
  ]
}
