'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useVideoSearch } from '@/hooks/useVideoSearch'
import type { YouTubeVideo } from '@/types'

interface VideoEmbedProps {
  techniqueId: string
  videoQuery: string
  cachedVideos?: YouTubeVideo[]
}

export function VideoEmbed({ techniqueId, videoQuery, cachedVideos }: VideoEmbedProps) {
  const { videos, isLoading, error, fetchVideos } = useVideoSearch()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const displayVideos = cachedVideos?.length ? cachedVideos : videos
  const activeVideo = selectedId ? displayVideos.find((v) => v.id === selectedId) : displayVideos[0]

  useEffect(() => {
    fetchVideos(techniqueId, videoQuery, cachedVideos)
    // Reset play state when technique changes
    setIsPlaying(false)
    setSelectedId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [techniqueId, videoQuery])

  if (isLoading) {
    return <div className="w-full aspect-video rounded-xl bg-secondary animate-pulse" />
  }

  if (error || displayVideos.length === 0) {
    return (
      <div className="w-full aspect-video rounded-xl bg-secondary flex items-center justify-center">
        <p className="text-sm text-muted-foreground text-center px-4">
          {error ?? 'No videos found. Try searching on YouTube directly.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        {isPlaying && activeVideo ? (
          <iframe
            src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&rel=0`}
            title={activeVideo.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : activeVideo ? (
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 w-full h-full group focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label={`Play: ${activeVideo.title}`}
          >
            <Image
              src={activeVideo.thumbnail}
              alt={activeVideo.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 512px"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Play className="h-6 w-6 text-gray-900 fill-gray-900 ml-0.5" />
              </div>
            </div>
          </button>
        ) : null}
      </div>

      {activeVideo && (
        <div>
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
            {activeVideo.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeVideo.channelName}
            {activeVideo.duration && (
              <span className="ml-2 tabular-nums">{activeVideo.duration}</span>
            )}
          </p>
        </div>
      )}

      {displayVideos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayVideos.map((video, i) => (
            <button
              key={video.id}
              onClick={() => {
                setSelectedId(video.id)
                setIsPlaying(false)
              }}
              className={cn(
                'shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                selectedId === video.id || (!selectedId && i === 0)
                  ? 'border-primary'
                  : 'border-transparent hover:border-border'
              )}
              aria-label={`Select: ${video.title}`}
            >
              <div className="relative h-14 w-24">
                <Image
                  src={video.thumbnail}
                  alt={video.title}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
