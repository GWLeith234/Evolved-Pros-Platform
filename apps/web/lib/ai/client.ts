import Anthropic from '@anthropic-ai/sdk'

let cached: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')
  if (!cached) cached = new Anthropic({ apiKey })
  return cached
}
