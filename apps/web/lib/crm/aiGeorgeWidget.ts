/**
 * Where Conversations AI lives on the Evolved Pros platform.
 *
 * There is no /ask-george page and no /api/ask-george proxy (archived #80).
 * The widget is the member TopNav "Ask George" drawer, which embeds Vendasta
 * webchat. Leads still ingress via POST /api/webhooks/vendasta-conversations.
 */

export const AI_GEORGE_WEBCHAT_WIDGET_ID = '96dd7dbb-2a14-11f1-93eb-72103b668f62'
export const AI_GEORGE_WEBCHAT_CONTAINER_ID = 'ask-george-webchat'
export const AI_GEORGE_WEBCHAT_SDK_SRC = 'https://cdn.apigateway.co/webchat-client..prod/sdk.js'

/** Member Home is the representative signed-in surface that mounts TopNav. */
export const AI_GEORGE_SURFACE_PATH = '/home' as const
export const AI_GEORGE_ASK_QUERY = 'ask' as const
export const AI_GEORGE_ASK_VALUE = 'george' as const

/** Platform app host. Public www canonical is a different origin. */
export const AI_GEORGE_PLATFORM_ORIGIN = 'https://platform.evolvedpros.com'

export function askGeorgeSurfaceHref(): string {
  return `${AI_GEORGE_SURFACE_PATH}?${AI_GEORGE_ASK_QUERY}=${AI_GEORGE_ASK_VALUE}`
}

/** Pasteable URL for CoS. Opens the Ask George drawer on member Home. */
export function askGeorgeSurfaceUrl(origin: string = AI_GEORGE_PLATFORM_ORIGIN): string {
  return `${origin.replace(/\/$/, '')}${askGeorgeSurfaceHref()}`
}

export function shouldOpenAskGeorgeFromSearch(search: string): boolean {
  const raw = search.startsWith('?') ? search.slice(1) : search
  return new URLSearchParams(raw).get(AI_GEORGE_ASK_QUERY) === AI_GEORGE_ASK_VALUE
}
