'use client'

import { TechniqueCard } from '@/components/plan/TechniqueCard'
import type { Technique } from '@/types'

interface RoadmapPathProps {
  techniques: Technique[]
}

export function RoadmapPath({ techniques }: RoadmapPathProps) {
  if (techniques.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">No techniques found.</p>
      </div>
    )
  }

  return (
    <ol className="flex flex-col gap-3 pb-24" aria-label="Learning techniques">
      {techniques.map((technique, index) => (
        <li key={technique.id}>
          <TechniqueCard technique={technique} index={index} />
        </li>
      ))}
    </ol>
  )
}
