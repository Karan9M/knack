'use client'

import { useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/uiStore'
import { usePlanStore } from '@/store/planStore'
import { TechniqueContent } from '@/components/technique/TechniqueContent'
import { useIsMobile } from '@/hooks/use-mobile'

export function TechniqueSheet() {
  const { isSheetOpen, selectedTechniqueId, closeSheet, setSelectedTechniqueId } = useUIStore()
  const { activePlan } = usePlanStore()
  const prefersReduced = useReducedMotion()
  const isMobile = useIsMobile()

  const technique = activePlan?.techniques.find((t) => t.id === selectedTechniqueId) ?? null
  const techniques = activePlan?.techniques ?? []
  const index = techniques.findIndex((t) => t.id === selectedTechniqueId)
  const prevTechnique = index > 0 ? techniques[index - 1] : null
  const nextTechnique = index >= 0 && index < techniques.length - 1 ? techniques[index + 1] : null

  const handleClose = useCallback(() => closeSheet(), [closeSheet])
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    if (isSheetOpen && isMobile) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isSheetOpen, isMobile, handleClose])

  useEffect(() => {
    if (!isSheetOpen || !isMobile) return
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [isSheetOpen, isMobile, selectedTechniqueId])

  if (!isMobile) return null

  return (
    <AnimatePresence>
      {isSheetOpen && technique && activePlan && (
        <motion.div
          key="technique-fullscreen"
          role="dialog"
          aria-modal="true"
          aria-label={technique.name}
          className={cn(
            'fixed inset-0 z-[95] flex flex-col bg-background',
            'h-dvh max-h-dvh w-full touch-pan-y'
          )}
          initial={prefersReduced ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={prefersReduced ? undefined : { opacity: 0 }}
          transition={{ duration: prefersReduced ? 0 : 0.22, ease: 'easeOut' }}
        >
          <header
            className={cn(
              'shrink-0 flex items-center gap-2 border-b border-border bg-background/95 backdrop-blur-sm',
              'pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-2.5 px-2 sm:px-3'
            )}
          >
            <button
              type="button"
              onClick={handleClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:bg-border hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-1 items-center justify-center gap-1 min-w-0 px-1">
              <button
                type="button"
                disabled={!prevTechnique}
                onClick={() => prevTechnique && setSelectedTechniqueId(prevTechnique.id)}
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card',
                  'text-foreground hover:bg-secondary transition-colors',
                  'disabled:opacity-35 disabled:pointer-events-none'
                )}
                aria-label="Previous technique"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span
                className="min-w-[3.25rem] text-center text-xs font-semibold tabular-nums text-muted-foreground"
                aria-live="polite"
              >
                {index + 1} / {techniques.length}
              </span>

              <button
                type="button"
                disabled={!nextTechnique}
                onClick={() => nextTechnique && setSelectedTechniqueId(nextTechnique.id)}
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card',
                  'text-foreground hover:bg-secondary transition-colors',
                  'disabled:opacity-35 disabled:pointer-events-none'
                )}
                aria-label="Next technique"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="w-10 shrink-0" aria-hidden />
          </header>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
          >
            <TechniqueContent
              technique={technique}
              plan={activePlan}
              onClose={handleClose}
              hideFooterTechniqueNav
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
