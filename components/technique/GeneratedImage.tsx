'use client'

import { useEffect, useRef, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlanStore } from '@/store/planStore'
import { useUIStore } from '@/store/uiStore'
import type { ContentType } from '@/types'
import Image from 'next/image'

interface GeneratedImageProps {
  techniqueId: string
  techniqueName: string
  hobby: string
  contentType: ContentType
  /** Cached Pexels URL from Supabase — loads instantly from Pexels CDN on revisit. */
  initialImage?: string
}

const RESERVED_H = 'h-52'

interface ImageMeta {
  url: string
  photographer?: string
  photographerUrl?: string
}

export function GeneratedImage({
  techniqueId,
  techniqueName,
  hobby,
  contentType,
  initialImage,
}: GeneratedImageProps) {
  const [meta, setMeta] = useState<ImageMeta | null>(initialImage ? { url: initialImage } : null)
  const [fetching, setFetching] = useState(initialImage === undefined)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const fetchedRef = useRef(false)
  const updateTechniqueGeneratedImage = usePlanStore((s) => s.updateTechniqueGeneratedImage)
  const imageStyle = useUIStore((s) => s.preferences?.imageStyle)

  useEffect(() => {
    if (initialImage || fetchedRef.current) return
    fetchedRef.current = true

    fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ techniqueName, hobby, contentType, imageStyle }),
    })
      .then((r) => r.json())
      .then(
        (data: {
          url?: string
          photographer?: string
          photographerUrl?: string
          error?: string
        }) => {
          if (data.url) {
            setMeta({
              url: data.url,
              photographer: data.photographer,
              photographerUrl: data.photographerUrl,
            })
            updateTechniqueGeneratedImage(techniqueId, data.url)
            fetch(`/api/technique/${techniqueId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'generatedImage', url: data.url }),
            }).catch(console.error)
          } else {
            setFailed(true)
          }
        }
      )
      .catch(() => setFailed(true))
      .finally(() => setFetching(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [techniqueId])

  if (failed) return null

  const showSkeleton = fetching || (meta !== null && !imgLoaded)

  return (
    <div className="my-8">
      {showSkeleton && (
        <div
          className={cn(
            'w-full rounded-xl bg-secondary animate-pulse flex flex-col items-center justify-center gap-2',
            RESERVED_H
          )}
        >
          <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground/50">
            {fetching ? 'Finding illustration…' : 'Loading…'}
          </p>
        </div>
      )}

      {meta && (
        <figure className={cn(showSkeleton && 'hidden')}>
          <div className={cn('w-full overflow-hidden rounded-xl', RESERVED_H)}>
            <Image
              width={100}
              height={100}
              src={meta.url}
              alt={`${techniqueName} in ${hobby}`}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              unoptimized
              onLoad={() => setImgLoaded(true)}
              onError={() => setFailed(true)}
            />
          </div>
          {meta.photographer && (
            <figcaption className="mt-1.5 text-[10px] text-muted-foreground/40 text-right">
              Photo by{' '}
              <a
                href={meta.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {meta.photographer}
              </a>{' '}
              on Pexels
            </figcaption>
          )}
        </figure>
      )}
    </div>
  )
}
