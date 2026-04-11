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
  const updateTechniqueVideos = usePlanStore((s) => s.updateTechniqueVideos)

  const fetchVideos = useCallback(
    async (techniqueId: string, query: string, cached?: YouTubeVideo[]) => {
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
        const list = data.videos ?? []
        setVideos(list)

        if (list.length === 0) {
          setError(
            'No videos loaded. If this happens often, the YouTube API quota or key limits may be active — try again in a while or search on YouTube directly.'
          )
          return
        }

        updateTechniqueVideos(techniqueId, list)
        fetch(`/api/technique/${techniqueId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cacheVideos', videos: list }),
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
