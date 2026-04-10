'use client'

import { usePlanStore } from '@/store/planStore'
import type { Plan, Technique } from '@/types'

interface UsePlanReturn {
  activePlan: Plan | null
  isLoaded: boolean
  techniques: Technique[]
  masteredCount: number
  totalCount: number
  progressPercent: number
  setPlan: (plan: Plan) => void
}

export function usePlan(): UsePlanReturn {
  const { activePlan, isLoaded, setPlan } = usePlanStore()

  const techniques = activePlan?.techniques ?? []
  const masteredCount = techniques.filter((t) => t.status === 'mastered').length
  const totalCount = techniques.length
  const progressPercent = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0

  return {
    activePlan,
    isLoaded,
    techniques,
    masteredCount,
    totalCount,
    progressPercent,
    setPlan,
  }
}
