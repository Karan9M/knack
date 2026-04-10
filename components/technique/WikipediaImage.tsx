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

// Words that are too generic to be useful as a relevance signal — they appear in
// unrelated Wikipedia articles (military, politics, geography, etc.)
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

/**
 * Returns false if the Wikipedia result is clearly unrelated to the hobby/technique.
 *
 * Strategy: the Wikipedia page title MUST contain at least one hobby word,
 * OR at least two technique words that are not in the ambiguous list.
 * This prevents "Front Foot Defense" from matching a war article.
 */
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

  // Primary gate: hobby must appear somewhere in the page title or caption
  const hobbyMatches = hobbyWords.some((w) => combined.includes(w))
  if (hobbyMatches) return true

  // Fallback: at least 2 non-ambiguous technique words must appear
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
  // Only show skeleton on first load attempt; if initialImage is explicitly undefined we try to fetch
  const [isLoading, setIsLoading] = useState(initialImage === undefined)
  // Narrow selector: only gets the action function (stable reference — never causes re-renders)
  const updateTechniqueWikipedia = usePlanStore((s) => s.updateTechniqueWikipedia)

  useEffect(() => {
    if (initialImage || image) return

    setIsLoading(true)
    // Include hobby in the query so Wikipedia search is scoped to the right domain.
    // e.g. "Front Foot Defense cricket" not just "Front Foot Defense"
    const query = `${techniqueName} ${hobby}`

    fetch(`/api/wikipedia?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data: { image: WikipediaImageType | null }) => {
        if (data.image && isRelevantImage(data.image, techniqueName, hobby)) {
          setImage(data.image)
          updateTechniqueWikipedia(techniqueId, data.image)
          // Persist to Supabase
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

  // Reserve a fixed height (h-52 = 208px) in both skeleton and loaded states so
  // the article text below never jumps when the image arrives or decodes.
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
          loading="lazy"
          decoding="async"
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
