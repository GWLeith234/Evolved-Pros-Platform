'use client'

/**
 * Legacy SSR-off wrapper — kept as a re-export so any stale imports keep
 * working. Community page now imports UnifiedCommunityPage directly (SSR on).
 */
export { UnifiedCommunityPage as UnifiedCommunityPageClient } from '@/components/community/UnifiedCommunityPage'
