'use client'

import { useState, useCallback } from 'react'
import { usePlanStore } from '@/store/planStore'
import type { YouTubeVideo } from '@/types'
import { FETCH_VIDEOS_ENDPOINT } from '@/constants'

interface UseVideoSearchReturn {
  videos: YouTubeVideo[]
  isLoading: boolean
  error: string | null
  fetchVideos: (techniqueId: string, query: string, cached?: YouTubeVideo[]) => Promise<void>
}

export function useVideoSearch(): UseVideoSearchReturn {
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Narrow selector — action refs are stable in Zustand, so this never causes re-renders
  const updateTechniqueVideos = usePlanStore((s) => s.updateTechniqueVideos)

  const fetchVideos = useCallback(
    async (techniqueId: string, query: string, cached?: YouTubeVideo[]) => {
      // Use cached videos if available
      if (cached?.length) {
        setVideos(cached)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const res = await fetch(FETCH_VIDEOS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })

        if (!res.ok) throw new Error(`Failed to fetch videos: ${res.statusText}`)

        const data = (await res.json()) as { videos: YouTubeVideo[] }
        setVideos(data.videos)

        // Persist to Supabase + update store
        updateTechniqueVideos(techniqueId, data.videos)
        fetch(`/api/technique/${techniqueId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cacheVideos', videos: data.videos }),
        }).catch(console.error)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load videos')
      } finally {
        setIsLoading(false)
      }
    },
    [updateTechniqueVideos]
  )

  return { videos, isLoading, error, fetchVideos }
}
