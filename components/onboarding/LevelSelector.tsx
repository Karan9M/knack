'use client'

import { useCallback, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SKILL_LEVELS, SKILL_LEVEL_LABELS } from '@/constants'
import {
  allowedTargetsForCurrent,
  isValidPlanLevelPair,
  isAdvancedContinuedLearning,
} from '@/lib/skillLevels'
import type { SkillLevel } from '@/types'

interface LevelSelectorProps {
  hobby: string
  onSubmit: (currentLevel: SkillLevel, targetLevel: SkillLevel) => void
  onBack: () => void
}

export function LevelSelector({ hobby, onSubmit, onBack }: LevelSelectorProps) {
  const [currentLevel, setCurrentLevel] = useState<SkillLevel>('beginner')
  const [targetLevel, setTargetLevel] = useState<SkillLevel>('intermediate')
  const prefersReduced = useReducedMotion()

  const selectCurrentLevel = useCallback((level: SkillLevel) => {
    setCurrentLevel(level)
    if (level === 'advanced') {
      setTargetLevel('advanced')
      return
    }
    const allowed = allowedTargetsForCurrent(level)
    setTargetLevel((prev) => (allowed.includes(prev) ? prev : allowed[0]!))
  }, [])

  const targetOptions = allowedTargetsForCurrent(currentLevel)
  const isAdvancedPath = isAdvancedContinuedLearning(currentLevel, targetLevel)
  const canSubmit = isValidPlanLevelPair(currentLevel, targetLevel)

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full flex flex-col gap-8"
    >
      <div className="text-center">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 inline-flex items-center gap-1"
        >
          ← Back
        </button>
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
          Your <span className="text-primary capitalize">{hobby}</span> journey
        </h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Help us calibrate your roadmap perfectly.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            I&apos;m currently a
          </span>
          <div className="grid grid-cols-3 gap-2">
            {SKILL_LEVELS.map((level) => (
              <LevelButton
                key={level}
                level={level}
                isSelected={currentLevel === level}
                onClick={() => selectCurrentLevel(level)}
              />
            ))}
          </div>
        </div>

        {currentLevel === 'advanced' ? (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 px-5 py-6 text-center space-y-2">
            <p className="text-sm font-medium text-foreground leading-snug">
              There&apos;s always another level.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You&apos;re already advanced—so we&apos;ll skip &quot;what&apos;s next on the
              ladder&quot; and build a roadmap of deeper skills, refinements, and fresh angles in
              your craft.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground whitespace-nowrap">
                wanting to reach
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="flex flex-col gap-3">
              <div
                className={cn(
                  'grid gap-2',
                  targetOptions.length === 1 ? 'grid-cols-1 max-w-sm mx-auto w-full' : 'grid-cols-2'
                )}
              >
                {targetOptions.map((level) => (
                  <LevelButton
                    key={level}
                    level={level}
                    isSelected={targetLevel === level}
                    onClick={() => setTargetLevel(level)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => canSubmit && onSubmit(currentLevel, targetLevel)}
        disabled={!canSubmit}
        className={cn(
          'w-full h-14 rounded-2xl flex items-center justify-center gap-2',
          'bg-primary text-primary-foreground font-semibold text-base',
          'shadow-[0_4px_0_0_oklch(0.48_0.12_39)] active:shadow-none active:translate-y-1',
          'transition-all duration-100',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0',
          'hover:brightness-105'
        )}
      >
        {isAdvancedPath ? 'Build my deeper roadmap' : 'Build my roadmap'}
        <ArrowRight className="h-5 w-5" />
      </button>
    </motion.div>
  )
}

interface LevelButtonProps {
  level: SkillLevel
  isSelected: boolean
  onClick: () => void
}

function LevelButton({ level, isSelected, onClick }: LevelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-12 rounded-xl border text-sm font-medium transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-primary/40',
        isSelected
          ? 'border-primary bg-primary/10 text-primary font-semibold shadow-sm'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
      )}
    >
      {SKILL_LEVEL_LABELS[level]}
    </button>
  )
}
