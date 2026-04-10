'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { usePlanStore } from '@/store/planStore'
import { useUIStore } from '@/store/uiStore'
import { useStreak } from '@/hooks/useStreak'
import { PlanSwitcherSidebar } from '@/components/plan/PlanSwitcherSidebar'
import { TechniqueNavPanel } from '@/components/plan/TechniqueNavPanel'
import { RoadmapPath } from '@/components/plan/RoadmapPath'
import { PlanHeader } from '@/components/plan/PlanHeader'
import { TechniqueContent } from '@/components/technique/TechniqueContent'
import { KnackIcon } from '@/components/layout/KnackIcon'
import { KnackWordmark } from '@/components/layout/KnackWordmark'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { getSessionId } from '@/lib/session'
import { readResumeState, writeResumeState } from '@/lib/resumeState'
import { APP_NAME } from '@/constants'
import type { Plan, SkillLevel } from '@/types'
import type { PlanSummary } from '@/components/plan/PlanSwitcherSidebar'

// Mobile-only bottom sheet — lazy so it doesn't bloat the initial JS bundle
const TechniqueSheet = dynamic(
  () => import('@/components/technique/TechniqueSheet').then((m) => m.TechniqueSheet),
  { ssr: false }
)

interface PlanViewProps {
  initialPlan: Plan
}

export function PlanView({ initialPlan }: PlanViewProps) {
  // ── Store selectors — narrow primitives to avoid infinite-loop snapshots ──
  const setPlan = usePlanStore((s) => s.setPlan)
  const techniques = usePlanStore((s) => s.activePlan?.techniques ?? initialPlan.techniques)
  const hobby = usePlanStore((s) => s.activePlan?.hobby ?? initialPlan.hobby)
  const currentLevel = usePlanStore((s) => s.activePlan?.currentLevel ?? initialPlan.currentLevel)
  const targetLevel = usePlanStore((s) => s.activePlan?.targetLevel ?? initialPlan.targetLevel)
  const planId = usePlanStore((s) => s.activePlan?.id ?? initialPlan.id)

  const selectedTechniqueId = useUIStore((s) => s.selectedTechniqueId)
  const setSelectedTechniqueId = useUIStore((s) => s.setSelectedTechniqueId)
  const [resumeBannerText, setResumeBannerText] = useState<string | null>(null)
  const hasHydratedSelectionRef = useRef(false)

  // Hydrate Zustand from SSR-fetched plan
  useEffect(() => {
    setPlan(initialPlan)
  }, [initialPlan, setPlan])

  // ── Streak ────────────────────────────────────────────────────────────────
  const { streak, bumpStreak } = useStreak()
  useEffect(() => {
    bumpStreak()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Initial selection hydration (resume first, then fallback) ─────────────
  useEffect(() => {
    hasHydratedSelectionRef.current = false
  }, [planId])

  useEffect(() => {
    if (hasHydratedSelectionRef.current || techniques.length === 0) return

    if (selectedTechniqueId) {
      hasHydratedSelectionRef.current = true
      return
    }

    const resume = readResumeState()
    if (resume && resume.planId === planId) {
      const resumedTechnique = techniques.find((t) => t.id === resume.techniqueId)
      if (resumedTechnique) {
        setSelectedTechniqueId(resumedTechnique.id)
        setResumeBannerText(`Welcome back — you were on ${resumedTechnique.name}`)
        hasHydratedSelectionRef.current = true
        return
      }
    }

    const first = techniques.find((t) => t.status === 'pending')
    if (first) setSelectedTechniqueId(first.id)
    hasHydratedSelectionRef.current = true
  }, [planId, selectedTechniqueId, setSelectedTechniqueId, techniques])

  useEffect(() => {
    if (!resumeBannerText) return
    const timer = window.setTimeout(() => setResumeBannerText(null), 3000)
    return () => window.clearTimeout(timer)
  }, [resumeBannerText])

  useEffect(() => {
    if (!selectedTechniqueId) return
    const selected = techniques.find((t) => t.id === selectedTechniqueId)
    if (!selected) return
    writeResumeState({
      planId,
      techniqueId: selectedTechniqueId,
      techniqueName: selected.name,
    })
  }, [planId, selectedTechniqueId, techniques])

  // ── Past plans for the left switcher sidebar ──────────────────────────────
  const [allPlans, setAllPlans] = useState<PlanSummary[]>([])
  useEffect(() => {
    const sessionId = getSessionId()
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => r.json())
      .then((data: { plans?: Plan[] }) => {
        const summaries: PlanSummary[] = (data.plans ?? []).map((p) => ({
          id: p.id,
          hobby: p.hobby,
          currentLevel: p.currentLevel as SkillLevel,
          targetLevel: p.targetLevel as SkillLevel,
          masteredCount: p.techniques.filter((t) => t.status === 'mastered').length,
          totalCount: p.techniques.length,
        }))
        setAllPlans(summaries)
      })
      .catch(() => {})
  }, [])

  // ── Floating nav — rAF-throttled scroll listener ──────────────────────────
  const contentRef = useRef<HTMLDivElement>(null)
  const [floatingNav, setFloatingNav] = useState(false)
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    let ticking = false
    const handle = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setFloatingNav(el.scrollTop > 48)
          ticking = false
        })
        ticking = true
      }
    }
    el.addEventListener('scroll', handle, { passive: true })
    return () => el.removeEventListener('scroll', handle)
  }, [])

  // ── Right panel collapse state ─────────────────────────────────────────────
  const [navOpen, setNavOpen] = useState(true)

  // ── Derived values ─────────────────────────────────────────────────────────
  const masteredCount = useMemo(
    () => techniques.filter((t) => t.status === 'mastered').length,
    [techniques]
  )

  const selectedTechnique = useMemo(
    () =>
      selectedTechniqueId ? (techniques.find((t) => t.id === selectedTechniqueId) ?? null) : null,
    [selectedTechniqueId, techniques]
  )

  const plan: Plan = useMemo(
    () => ({ ...initialPlan, id: planId, hobby, currentLevel, targetLevel, techniques }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [planId, hobby, currentLevel, targetLevel, techniques]
  )

  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          '--sidebar-width': '14rem',
          '--sidebar-width-icon': '3.25rem',
        } as React.CSSProperties
      }
      className="h-dvh overflow-hidden"
    >
      {/* ── LEFT: plan switcher sidebar ──────────────────────────────── */}
      <PlanSwitcherSidebar
        currentPlanId={planId}
        currentHobby={hobby}
        currentLevel={currentLevel}
        targetLevel={targetLevel}
        masteredCount={masteredCount}
        totalCount={techniques.length}
        allPlans={allPlans}
      />

      {/* ── CENTRE + RIGHT: inset that fills remaining width ─────────── */}
      <SidebarInset className="flex flex-col overflow-hidden min-h-0 h-dvh">
        <AnimatePresence>
          {resumeBannerText && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="fixed top-4 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-primary/20 bg-background/95 px-4 py-2 text-sm text-foreground shadow-lg backdrop-blur"
            >
              {resumeBannerText}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile-only navbar (keeps floaty behavior on scroll) */}
        <header
          className={cn(
            'md:hidden shrink-0 z-40 transition-all duration-300 ease-in-out',
            floatingNav ? 'p-2' : 'border-b border-border bg-background'
          )}
        >
          <div
            className={cn(
              'flex items-center h-12 px-3 gap-2 transition-all duration-300',
              floatingNav &&
                'bg-background/90 backdrop-blur-md border border-border shadow-lg rounded-2xl'
            )}
          >
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
              aria-label={`${APP_NAME} home`}
            >
              <KnackIcon
                size={18}
                className="shrink-0 transition-transform group-hover:scale-110 duration-200"
              />
              <KnackWordmark
                height={15}
                className="hidden sm:block text-foreground transition-opacity group-hover:opacity-70"
              />
            </Link>
            <ThemeToggle className="ml-auto" />
          </div>
        </header>

        {/* Body: center column + full-height right sidebar */}
        <div className="flex flex-1 min-h-0">
          {/* ── Center column (desktop header width == main content width) ── */}
          <div className="flex flex-col flex-1 min-w-0 min-h-0">
            {/* Desktop-only navbar */}
            <header
              className={cn(
                'hidden md:block shrink-0 z-40 transition-all duration-300 ease-in-out',
                floatingNav ? 'p-2' : 'border-b border-border bg-background'
              )}
            >
              <div
                className={cn(
                  'flex items-center h-12 px-3 gap-2 transition-all duration-300',
                  floatingNav &&
                    'bg-background/90 backdrop-blur-md border border-border shadow-lg rounded-2xl'
                )}
              >
                <Link
                  href="/"
                  className="flex items-center gap-2.5 group"
                  aria-label={`${APP_NAME} home`}
                >
                  <KnackIcon
                    size={18}
                    className="shrink-0 transition-transform group-hover:scale-110 duration-200"
                  />
                  <KnackWordmark
                    height={15}
                    className="hidden sm:block text-foreground transition-opacity group-hover:opacity-70"
                  />
                </Link>
                <ThemeToggle className="ml-auto" />
              </div>
            </header>

            {/* ── Scrollable content ───────────────────────────────────── */}
            <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
              {/* Mobile: roadmap list + bottom sheet */}
              <div className="md:hidden">
                <div className="px-4 py-4">
                  <PlanHeader plan={plan} masteredCount={masteredCount} />
                </div>
                <div className="px-4">
                  <RoadmapPath techniques={techniques} />
                </div>
                <TechniqueSheet />
              </div>

              {/* Desktop: article view */}
              <div className="hidden md:block">
                {selectedTechnique ? (
                  <TechniqueContent
                    key={selectedTechnique.id}
                    technique={selectedTechnique}
                    plan={plan}
                  />
                ) : (
                  <EmptyState hobby={plan.hobby} />
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: technique navigator panel (desktop only) ────────── */}
          <TechniqueNavPanel
            techniques={techniques}
            selectedId={selectedTechniqueId}
            onSelect={setSelectedTechniqueId}
            masteredCount={masteredCount}
            streak={streak}
            open={navOpen}
            onToggle={() => setNavOpen((v) => !v)}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function EmptyState({ hobby }: { hobby: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8 gap-3">
      <p className="text-2xl font-bold text-foreground">Select a technique</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Choose a <span className="font-medium text-foreground capitalize">{hobby}</span> technique
        from the panel on the right to start learning.
      </p>
    </div>
  )
}
