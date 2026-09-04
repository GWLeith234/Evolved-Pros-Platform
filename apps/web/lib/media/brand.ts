/** Public /media brand lock. Document title, H1, and article suffix share this. */
export const MEDIA_BRAND = 'Evolved Pros Media'

export const MEDIA_HUB_TITLE =
  'Evolved Pros Media | Sales & Personal Development Intelligence'

export const MEDIA_HUB_DESCRIPTION =
  'Pioneer stories, leadership insights, and business strategy from the EVOLVED framework.'

export function mediaStoryTitle(storyTitle: string): string {
  return `${storyTitle} | ${MEDIA_BRAND}`
}

export function mediaSectionTitle(section: string): string {
  return `${section} | ${MEDIA_BRAND}`
}
