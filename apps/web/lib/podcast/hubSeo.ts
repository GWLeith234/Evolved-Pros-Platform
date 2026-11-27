/**
 * Search title and snippet for the public /podcast hub only.
 *
 * The root layout sets a string title, not a title template, so these
 * strings are the full <title>, og:title, and twitter:title. Do not append
 * " | Evolved Pros": that suffix is 15 characters and would put the title
 * at 70, past Google's ~60-character display, and it would repeat the brand
 * already in the title.
 *
 * The supplied description was 162 characters. "Full " was dropped so the
 * sentence still ends on a period, stays inside 140–158, and is kept whole
 * by boundPublishedDescription (a finished sentence may run to 160).
 */

export const PODCAST_HUB_TITLE = 'Evolved Pros Podcast: AI, Sales & GTM with George Leith'

export const PODCAST_HUB_DESCRIPTION =
  'Weekly long-form interviews with George Leith and operators on AI, sales leadership and go-to-market. Transcripts, chapters and highlights for every episode.'

/** Visible hub H1. The lockup PNG stays the wordmark; this is the text heading. */
export const PODCAST_HUB_H1 = 'The Evolved Pros Podcast'
