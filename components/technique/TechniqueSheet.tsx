'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { usePlanStore } from '@/store/planStore'
import { TechniqueContent } from '@/components/technique/TechniqueContent'

export function TechniqueSheet() {
  const { isSheetOpen, selectedTechniqueId, closeSheet } = useUIStore()
  const { activePlan } = usePlanStore()
  const prefersReduced = useReducedMotion()

  const technique = activePlan?.techniques.find((t) => t.id === selectedTechniqueId) ?? null

  const handleClose = useCallback(() => closeSheet(), [closeSheet])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    if (isSheetOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isSheetOpen, handleClose])

  return (
    <AnimatePresence>
      {isSheetOpen && technique && activePlan && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Bottom sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={technique.name}
            className={cn(
              'fixed z-50 bg-background overflow-hidden',
              'bottom-0 left-0 right-0 rounded-t-3xl max-h-[92dvh]'
            )}
            initial={prefersReduced ? { opacity: 0 } : { y: '100%' }}
            animate={prefersReduced ? { opacity: 1 } : { y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { y: '100%' }}
            transition={
              prefersReduced ? { duration: 0.15 } : { type: 'spring', stiffness: 320, damping: 32 }
            }
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1.5 w-10 rounded-full bg-border" aria-hidden />
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-secondary flex items-center justify-center hover:bg-border transition-colors z-10"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Scrollable content — delegated to TechniqueContent */}
            <div className="overflow-y-auto max-h-[calc(92dvh-2.5rem)]">
              <TechniqueContent technique={technique} plan={activePlan} onClose={handleClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
