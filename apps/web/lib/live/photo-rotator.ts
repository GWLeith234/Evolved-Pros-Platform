export interface RotatorPhoto {
  src: string
  caption: string
  /** Speaking-event location, rendered as "Caption — City, Country". */
  city?: string
  country?: string
}

export const ROTATOR_PHOTOS: RotatorPhoto[] = [
  { src: '/live/george-cloud-broker.jpg',      caption: 'The Rise of the Cloud Broker', city: 'Dubrovnik', country: 'Croatia' },
  { src: '/live/george-stage-blue-jacket.jpg', caption: 'Conquer Local',                 city: 'San Diego', country: 'USA' },
  { src: '/live/george-vendastacon-2018.jpg',  caption: 'A Path to Recurring Revenue',   city: 'Banff',     country: 'Canada' },
  { src: 'https://udbwrapkshfjkctylbmm.supabase.co/storage/v1/object/public/Branding/TVOT%20Panel%20closeup%20-%20sharpened.png', caption: 'TVOT 2026 Panel', city: 'Montreal', country: 'Canada' },
]
