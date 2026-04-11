'use client'

import { ProgressRing } from '@/components/plan/ProgressRing'
import { StreakBadge } from '@/components/plan/StreakBadge'
import { useStreak } from '@/hooks/useStreak'
import { SKILL_LEVEL_LABELS } from '@/constants'
import { isAdvancedContinuedLearning } from '@/lib/skillLevels'
import type { Plan } from '@/types'

interface PlanHeaderProps {
  plan: Plan
  masteredCount: number
}

export function PlanHeader({ plan, masteredCount }: PlanHeaderProps) {
  const { streak } = useStreak()
  const total = plan.techniques.length
  const isComplete = masteredCount === total && total > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            Your roadmap
          </p>
          <h1 className="text-3xl font-bold text-foreground capitalize leading-tight">
            {plan.hobby}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdvancedContinuedLearning(plan.currentLevel, plan.targetLevel) ? (
              <>
                <span className="text-foreground font-medium">Advanced</span>
                <span className="text-muted-foreground/60"> · </span>
                <span>Deeper mastery &amp; new edges</span>
              </>
            ) : (
              <>
                {SKILL_LEVEL_LABELS[plan.currentLevel]}{' '}
                <span className="text-muted-foreground/60">→</span>{' '}
                <span className="text-foreground font-medium">
                  {SKILL_LEVEL_LABELS[plan.targetLevel]}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 flex-shrink-0 pt-0.5">
          <ProgressRing mastered={masteredCount} total={total} size={76} />
          <StreakBadge count={streak.count} />
        </div>
      </div>

      {isComplete && (
        <div className="rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3 text-center">
          <span className="text-sm font-semibold text-primary">
            🎉 Roadmap complete! You&apos;ve mastered all techniques.
          </span>
        </div>
      )}
    </div>
  )
}
