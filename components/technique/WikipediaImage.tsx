'use client'

import { useEffect, useState } from 'react'
import { usePlanStore } from '@/store/planStore'
import type { WikipediaImage as WikipediaImageType } from '@/types'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface WikipediaImageProps {
  techniqueId: string
  techniqueName: string
  hobby: string
  initialImage?: WikipediaImageType
}

const AMBIGUOUS_WORDS = new Set([
  'defense',
  'defence',
  'attack',
  'front',
  'back',
  'foot',
  'hand',
  'head',
  'move',
  'play',
  'form',
  'shot',
  'pass',
  'position',
  'line',
  'base',
  'point',
  'side',
  'open',
  'close',
  'drive',
  'turn',
  'spin',
  'push',
  'pull',
  'control',
  'step',
  'break',
  'block',
  'guard',
  'stand',
  'cross',
])

function isRelevantImage(image: WikipediaImageType, techniqueName: string, hobby: string): boolean {
  const titleLower = image.pageTitle.toLowerCase()
  const captionLower = image.caption.toLowerCase()
  const combined = `${titleLower} ${captionLower}`

  const hobbyWords = hobby
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
  const techWords = techniqueName
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4 && !AMBIGUOUS_WORDS.has(w))

  const hobbyMatches = hobbyWords.some((w) => combined.includes(w))
  if (hobbyMatches) return true

  const techMatches = techWords.filter((w) => combined.includes(w))
  return techMatches.length >= 2
}

export function WikipediaImage({
  techniqueId,
  techniqueName,
  hobby,
  initialImage,
}: WikipediaImageProps) {
  const [image, setImage] = useState<WikipediaImageType | null>(initialImage ?? null)
  const [isLoading, setIsLoading] = useState(initialImage === undefined)
  const updateTechniqueWikipedia = usePlanStore((s) => s.updateTechniqueWikipedia)

  useEffect(() => {
    if (initialImage || image) return

    setIsLoading(true)
    const query = `${techniqueName} ${hobby}`

    fetch(`/api/wikipedia?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data: { image: WikipediaImageType | null }) => {
        if (data.image && isRelevantImage(data.image, techniqueName, hobby)) {
          setImage(data.image)
          updateTechniqueWikipedia(techniqueId, data.image)
          fetch(`/api/technique/${techniqueId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'wikipediaImage', image: data.image }),
          }).catch(console.error)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [techniqueId, techniqueName, hobby])

  const RESERVED_H = 'h-52'

  if (isLoading) {
    return (
      <div className="my-6 rounded-xl overflow-hidden">
        <div className={cn('w-full bg-secondary animate-pulse rounded-xl', RESERVED_H)} />
        <div className="h-3.5 bg-secondary/60 animate-pulse mt-2 rounded w-2/3 mx-auto" />
      </div>
    )
  }

  if (!image) return null

  return (
    <figure className="my-8">
      {/* Fixed-height container prevents layout shift when the bitmap decodes */}
      <div className={cn('w-full overflow-hidden rounded-xl', RESERVED_H)}>
        <Image
          width={100}
          height={100}
          src={image.url}
          alt={image.caption}
          className="w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          unoptimized
        />
      </div>
      <figcaption
        className={cn('text-xs text-center mt-2.5 text-muted-foreground/80 italic leading-relaxed')}
      >
        {image.caption}
      </figcaption>
    </figure>
  )
}
