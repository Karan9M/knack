'use client'

import { memo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Check, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { CONTENT_TYPE_LABELS } from '@/constants'
import type { Technique } from '@/types'

interface TechniqueCardProps {
  technique: Technique
  index: number
}

export const TechniqueCard = memo(function TechniqueCard({ technique, index }: TechniqueCardProps) {
  // Narrow selector — only re-renders when the action reference changes (never in Zustand)
  const openTechnique = useUIStore((s) => s.openTechnique)
  const prefersReduced = useReducedMotion()

  const isMastered = technique.status === 'mastered'
  const isSkipped = technique.status === 'skipped'
  const isPending = technique.status === 'pending'

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
    >
      <button
        onClick={() => openTechnique(technique.id)}
        className={cn(
          'w-full text-left rounded-2xl border p-4 transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary/40',
          'hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
          isPending && 'bg-card border-border hover:border-primary/30',
          isMastered && 'bg-emerald-50 border-emerald-200 hover:border-emerald-300',
          isSkipped && 'bg-secondary/50 border-border/60 opacity-60'
        )}
        aria-label={`Open technique: ${technique.name}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <StatusCircle status={technique.status} prefersReduced={!!prefersReduced} />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  'font-semibold text-base leading-snug',
                  isMastered && 'text-emerald-800',
                  isSkipped && 'line-through text-muted-foreground',
                  isPending && 'text-foreground'
                )}
              >
                {technique.name}
              </span>
              <span className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                <Clock className="h-3 w-3" />
                {technique.estimatedHours}h
              </span>
            </div>

            {!isSkipped && (
              <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
                {technique.hookFact}
              </p>
            )}

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium tracking-wide text-muted-foreground bg-secondary/80 rounded-md px-2 py-0.5">
                {CONTENT_TYPE_LABELS[technique.contentType]}
              </span>
              <DifficultyDots difficulty={technique.difficulty} />
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  )
})

interface StatusCircleProps {
  status: Technique['status']
  prefersReduced: boolean
}

function StatusCircle({ status, prefersReduced }: StatusCircleProps) {
  if (status === 'mastered') {
    return (
      <motion.div
        className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center"
        initial={prefersReduced ? false : { scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 18 }}
      >
        <Check className="h-4 w-4 text-white stroke-[2.5]" />
      </motion.div>
    )
  }
  if (status === 'skipped') {
    return (
      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
    )
  }
  return <div className="h-7 w-7 rounded-full border-2 border-border bg-background" />
}

function DifficultyDots({ difficulty }: { difficulty: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Difficulty ${difficulty} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={cn('h-1.5 w-1.5 rounded-full', i < difficulty ? 'bg-primary/70' : 'bg-border')}
        />
      ))}
    </div>
  )
}
