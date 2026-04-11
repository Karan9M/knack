import { SKILL_LEVEL_LABELS } from '@/constants'
import type { SkillLevel } from '@/types'

export const SKILL_LEVEL_ORDER: Record<SkillLevel, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
}

/** Target levels strictly above `current` (empty when already advanced). */
export function allowedTargetsForCurrent(current: SkillLevel): SkillLevel[] {
  const o = SKILL_LEVEL_ORDER[current]
  return (['beginner', 'intermediate', 'advanced'] as const).filter((l) => SKILL_LEVEL_ORDER[l] > o)
}

/**
 * Valid plan level pairs: target must be higher than current, except advanced learners
 * who stay on "advanced" for a deepen / keep-learning roadmap.
 */
export function isValidPlanLevelPair(current: SkillLevel, target: SkillLevel): boolean {
  if (current === 'advanced' && target === 'advanced') return true
  return SKILL_LEVEL_ORDER[target] > SKILL_LEVEL_ORDER[current]
}

/** Stored as current=advanced & target=advanced for "keep learning" roadmaps. */
export function isAdvancedContinuedLearning(current: SkillLevel, target: SkillLevel): boolean {
  return current === 'advanced' && target === 'advanced'
}

/** Single-line label for sidebars and compact plan chrome. */
export function formatPlanLevelJourney(current: SkillLevel, target: SkillLevel): string {
  if (isAdvancedContinuedLearning(current, target)) return 'Advanced · Keep learning'
  return `${SKILL_LEVEL_LABELS[current]} → ${SKILL_LEVEL_LABELS[target]}`
}
