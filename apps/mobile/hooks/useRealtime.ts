import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Post } from '@/lib/types'

export function useRealtimePosts(
  channelSlug: string,
  onNewPost: (post: Post) => void,
): void {
  useEffect(() => {
    const channel = supabase
      .channel(`posts:${channelSlug}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'posts',
          filter: `channel_slug=eq.${channelSlug}`,
        },
        payload => onNewPost(payload.new as Post),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelSlug, onNewPost])
}
