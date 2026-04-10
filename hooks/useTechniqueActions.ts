'use client'

import { useCallback } from 'react'
import { usePlanStore } from '@/store/planStore'
import { useUIStore } from '@/store/uiStore'
import type { TechniqueStatus } from '@/types'

interface UseTechniqueActionsReturn {
  markMastered: (techniqueId: string) => void
  skipTechnique: (techniqueId: string) => void
  updateStatus: (techniqueId: string, status: TechniqueStatus) => void
}

export function useTechniqueActions(): UseTechniqueActionsReturn {
  const { updateTechniqueStatus } = usePlanStore()
  const { closeSheet } = useUIStore()

  const markMastered = useCallback(
    (techniqueId: string) => {
      updateTechniqueStatus(techniqueId, 'mastered')
      closeSheet()
    },
    [updateTechniqueStatus, closeSheet]
  )

  const skipTechnique = useCallback(
    (techniqueId: string) => {
      updateTechniqueStatus(techniqueId, 'skipped')
      closeSheet()
    },
    [updateTechniqueStatus, closeSheet]
  )

  const updateStatus = useCallback(
    (techniqueId: string, status: TechniqueStatus) => {
      updateTechniqueStatus(techniqueId, status)
    },
    [updateTechniqueStatus]
  )

  return { markMastered, skipTechnique, updateStatus }
}
