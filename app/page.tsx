'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { HobbyInputBar } from '@/components/onboarding/HobbyInputBar'
import { LevelSelector } from '@/components/onboarding/LevelSelector'
import { GenerationScreen } from '@/components/onboarding/GenerationScreen'
import { PreferenceQuiz } from '@/components/onboarding/PreferenceQuiz'
import { BackgroundBeamsWithCollision } from '@/components/ui/background-beams-with-collision'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { OnboardingSidebar } from '@/components/layout/OnboardingSidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { usePlanStore } from '@/store/planStore'
import { useUIStore } from '@/store/uiStore'
import { getSessionId } from '@/lib/session'
import { readResumeState } from '@/lib/resumeState'
import { GENERATE_PLAN_ENDPOINT } from '@/constants'
import type { SkillLevel, Plan, GeneratePlanResponse, StreakData, UserPreferences } from '@/types'
import { cn } from '@/lib/utils'

type OnboardingStep = 'quiz' | 'hobby' | 'level' | 'generating'

interface PastPlan {
  id: string
  hobby: string
  currentLevel: SkillLevel
  targetLevel: SkillLevel
  lastActiveAt: string
  masteredCount: number
  totalCount: number
}

const PAST_PLANS_CACHE_KEY = 'knack_past_plans_v1'
const SKIP_RESUME_ONCE_KEY = 'knack_skip_resume_once'
const RESUME_HANDLED_ONCE_KEY = 'knack_resume_handled_once'

function readPastPlansCache(): PastPlan[] {
  try {
    const raw = localStorage.getItem(PAST_PLANS_CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p): p is PastPlan =>
        typeof p === 'object' &&
        p !== null &&
        typeof p.id === 'string' &&
        typeof p.hobby === 'string' &&
        typeof p.currentLevel === 'string' &&
        typeof p.targetLevel === 'string' &&
        typeof p.lastActiveAt === 'string' &&
        typeof p.masteredCount === 'number' &&
        typeof p.totalCount === 'number'
    )
  } catch {
    return []
  }
}

function writePastPlansCache(plans: PastPlan[]) {
  try {
    localStorage.setItem(PAST_PLANS_CACHE_KEY, JSON.stringify(plans))
  } catch {
    // Ignore storage failures (private mode / quota)
  }
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.toLowerCase().includes('application/json')) {
    return (await res.json()) as T
  }

  const body = await res.text()
  const looksLikeHtml = body.includes('<!DOCTYPE') || body.includes('<html')
  const suffix = looksLikeHtml ? ' API route is likely unavailable right now.' : ''
  throw new Error(`Request failed (${res.status} ${res.statusText}).${suffix}`)
}

// These heights must stay in sync with the shelf-line divs in the decorator columns
// so the horizontal rules perfectly bisect the left/right borders at content seams.
const HERO_H = 300
const INPUT_H = 110

const SUGGESTIONS = ['Chess', 'Fingerstyle guitar', 'Poker', 'Rock climbing', 'Oil painting']

export default function OnboardingPage() {
  const router = useRouter()
  const { setPlan } = usePlanStore()
  const { preferences, setPreferences } = useUIStore()

  // Always land on the hobby input first — quiz only appears after hobby is submitted
  // for first-time users (no saved preferences).
  const [step, setStep] = useState<OnboardingStep>('hobby')
  const [hobby, setHobby] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pastPlans, setPastPlans] = useState<PastPlan[]>([])
  const [resumeChecked, setResumeChecked] = useState(false)
  const [isResuming, setIsResuming] = useState(false)

  // Quiz sits between hobby and level — only shown once, then preferences are persisted.
  const handleQuizComplete = (prefs: UserPreferences) => {
    setPreferences(prefs)
    setStep('level')
  }

  useEffect(() => {
    const resumeAlreadyHandled = sessionStorage.getItem(RESUME_HANDLED_ONCE_KEY) === '1'
    if (resumeAlreadyHandled) {
      setResumeChecked(true)
      return
    }

    const skipResumeOnce = sessionStorage.getItem(SKIP_RESUME_ONCE_KEY) === '1'
    if (skipResumeOnce) {
      sessionStorage.removeItem(SKIP_RESUME_ONCE_KEY)
      sessionStorage.setItem(RESUME_HANDLED_ONCE_KEY, '1')
      setResumeChecked(true)
      return
    }

    const resume = readResumeState()
    if (resume?.planId) {
      sessionStorage.setItem(RESUME_HANDLED_ONCE_KEY, '1')
      setIsResuming(true)
      router.replace(`/plan/${resume.planId}`)
      return
    }
    sessionStorage.setItem(RESUME_HANDLED_ONCE_KEY, '1')
    setResumeChecked(true)
  }, [router])

  useEffect(() => {
    if (!resumeChecked || isResuming) return
    const cached = readPastPlansCache()
    if (cached.length > 0) setPastPlans(cached)

    const sessionId = getSessionId()
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => parseJsonResponse<{ plans: Plan[]; streak: StreakData }>(r))
      .then((data: { plans: Plan[]; streak: StreakData }) => {
        const mapped: PastPlan[] = (data.plans ?? []).map((p) => ({
          id: p.id,
          hobby: p.hobby,
          currentLevel: p.currentLevel,
          targetLevel: p.targetLevel,
          lastActiveAt: p.lastActiveAt,
          masteredCount: p.techniques.filter((t) => t.status === 'mastered').length,
          totalCount: p.techniques.length,
        }))
        setPastPlans(mapped)
        writePastPlansCache(mapped)
      })
      .catch(() => {})
  }, [isResuming, resumeChecked])

  const handleHobbySubmit = () => {
    const trimmed = inputValue.trim()
    if (trimmed.length < 2) return
    setHobby(trimmed)
    // First-time user: show personalisation quiz before level selection
    setStep(preferences ? 'level' : 'quiz')
  }

  const handleSuggestionClick = (suggestion: string) => {
    setHobby(suggestion)
    setStep(preferences ? 'level' : 'quiz')
  }

  const handleLevelSubmit = async (currentLevel: SkillLevel, targetLevel: SkillLevel) => {
    setStep('generating')
    setError(null)
    try {
      const sessionId = getSessionId()
      const res = await fetch(GENERATE_PLAN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hobby,
          currentLevel,
          targetLevel,
          sessionId,
          ...(preferences ? { preferences } : {}),
        }),
      })
      if (!res.ok) {
        const data = await parseJsonResponse<{ error?: string }>(res)
        throw new Error(data.error ?? 'Failed to generate plan')
      }
      const { planId, techniques } = await parseJsonResponse<GeneratePlanResponse>(res)
      const plan: Plan = {
        id: planId,
        hobby,
        currentLevel,
        targetLevel,
        techniques,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      }
      setPlan(plan)
      const latest: PastPlan = {
        id: planId,
        hobby,
        currentLevel,
        targetLevel,
        lastActiveAt: plan.lastActiveAt,
        masteredCount: 0,
        totalCount: techniques.length,
      }
      const merged = [latest, ...pastPlans.filter((p) => p.id !== planId)].slice(0, 20)
      setPastPlans(merged)
      writePastPlansCache(merged)
      router.push(`/plan/${planId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStep('level')
    }
  }

  if (!resumeChecked || isResuming) {
    return (
      <main className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        Loading your progress...
      </main>
    )
  }

  return (
    <SidebarProvider
      defaultOpen={true}
      style={
        {
          '--sidebar-width': '15rem',
          '--sidebar-width-icon': '3.25rem',
        } as React.CSSProperties
      }
    >
      <OnboardingSidebar pastPlans={pastPlans} showPlans={step === 'hobby'} />

      <SidebarInset>
        <BackgroundBeamsWithCollision className="flex flex-col h-dvh overflow-hidden">
          <main className="relative flex flex-col h-dvh overflow-hidden w-full">
            {/* ── Sticky 48 px header ─────────────────────────────────────────── */}
            <header
              className={cn(
                'sticky top-0 z-10 flex w-full shrink-0 items-center border-b border-black/10 dark:border-white/10 bg-background/90 backdrop-blur-sm',
                'min-h-[calc(2.75rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] pb-2.5 px-3',
                'md:h-12 md:min-h-12 md:py-0 md:pb-0 md:px-6'
              )}
            >
              {/* Mobile-only sidebar trigger */}
              <SidebarTrigger className="md:hidden shrink-0 text-muted-foreground hover:text-foreground" />
              {/* Theme toggle — ml-auto always pushes it to the far right */}
              <ThemeToggle className="ml-auto shrink-0" />
            </header>

            {/* ── Scrollable 3-column grid ─────────────────────────────────────── */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="relative flex w-full min-h-[calc(100dvh-3.25rem-env(safe-area-inset-top,0px))] md:min-h-[calc(100dvh-3rem)]">
                {/* Left decorator — vertical line + two horizontal shelf lines */}
                <div className="hidden md:flex flex-1 flex-col border-r border-black/10 dark:border-white/10">
                  <div
                    className="shrink-0 border-b border-black/10 dark:border-white/10"
                    style={{ height: HERO_H }}
                  />
                  <div
                    className="shrink-0 border-b border-black/10 dark:border-white/10"
                    style={{ height: INPUT_H }}
                  />
                  <div className="flex-1" />
                </div>

                {/* ── Center column (fixed 650 px on desktop, full-width on mobile) ── */}
                <div className="relative w-full md:w-[650px] shrink-0 flex flex-col min-h-full overflow-hidden">
                  {/* Gradient blobs — subtle warmth behind center content */}
                  <div
                    className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
                    aria-hidden
                  >
                    <div className="absolute -top-24 left-1/4 w-[480px] h-[480px] bg-primary/5 rounded-full blur-3xl" />
                    <div className="absolute top-48 right-0 w-64 h-64 bg-primary/4 rounded-full blur-2xl" />
                  </div>

                  <AnimatePresence mode="wait">
                    {/* ── Quiz step: preference screens ── */}
                    {step === 'quiz' && (
                      <motion.div
                        key="quiz"
                        className="flex flex-col flex-1 min-h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                      >
                        <PreferenceQuiz onComplete={handleQuizComplete} />
                      </motion.div>
                    )}

                    {/* ── Hobby step: grid-aligned hero + input + suggestions ── */}
                    {step === 'hobby' && (
                      <motion.div
                        key="hobby"
                        className="flex min-h-0 flex-1 flex-col pb-[max(1.25rem,env(safe-area-inset-bottom,0px))]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25 }}
                      >
                        {/* Hero: md matches shelf (300px); mobile uses min-height + flow so copy is not crushed */}
                        <div
                          className={cn(
                            'relative z-10 flex flex-col border-b border-black/10 dark:border-white/10 px-6 sm:px-8',
                            'justify-start gap-0 pb-10 pt-6 sm:pt-8',
                            'min-h-[min(46dvh,26rem)] sm:min-h-[min(44dvh,25rem)]',
                            'md:h-[300px] md:min-h-[300px] md:max-h-[300px] md:justify-end md:pb-8 md:pt-14'
                          )}
                        >
                          <p className="mb-3 text-xs font-semibold tracking-widest uppercase text-primary sm:mb-4 md:mb-5">
                            AI-powered skill roadmaps
                          </p>
                          <h1 className="text-[2.35rem] font-bold leading-[1.08] tracking-tight text-foreground/90 sm:text-5xl sm:leading-[1.06] md:text-[3.25rem]">
                            What do you want
                            <br />
                            to <em className="not-italic text-primary">master?</em>
                          </h1>
                          <p className="mt-2 text-[0.95rem] font-light leading-relaxed text-foreground/50 sm:mt-3 sm:text-base md:mt-4">
                            Focused skill roadmaps, personalised to your level.
                            <br />
                            5–8 techniques. No noise.
                          </p>
                        </div>

                        {/* Input section — md matches shelf line */}
                        <div
                          className={cn(
                            'relative z-10 flex items-center border-b border-black/10 dark:border-white/10 px-6 py-6 sm:px-8 sm:py-7',
                            'min-h-[7.5rem] md:min-h-[110px] md:px-8 md:py-5'
                          )}
                        >
                          <HobbyInputBar
                            value={inputValue}
                            onChange={setInputValue}
                            onSubmit={handleHobbySubmit}
                            autoFocus
                          />
                        </div>

                        {/* Suggestions — free-height section below second shelf */}
                        <div className="relative z-10 flex flex-1 flex-col px-6 py-3 sm:px-8 sm:py-4">
                          {SUGGESTIONS.map((s, i) => (
                            <motion.button
                              key={s}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.28, delay: 0.08 + i * 0.055 }}
                              onClick={() => handleSuggestionClick(s)}
                              className="group flex items-center w-full text-left hover:bg-black/2.5 dark:hover:bg-white/4 rounded-xl transition-colors"
                            >
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 ml-2 opacity-25 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all" />
                              <span
                                className={cn(
                                  'font-light text-[14px] leading-snug py-3 mx-3 w-full text-foreground/70',
                                  'border-b border-black/10 dark:border-white/10',
                                  i === SUGGESTIONS.length - 1 && 'border-0'
                                )}
                              >
                                {s}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* ── Level + generating steps: vertically centred in remaining space ── */}
                    {(step === 'level' || step === 'generating') && (
                      <motion.div
                        key={step}
                        className="relative z-10 flex-1 flex items-center justify-center px-8 py-16"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      >
                        <div className="w-full max-w-md">
                          {step === 'level' && (
                            <LevelSelector
                              hobby={hobby}
                              onSubmit={handleLevelSubmit}
                              onBack={() => setStep('hobby')}
                            />
                          )}
                          {step === 'generating' && <GenerationScreen hobby={hobby} />}
                          {error && (
                            <motion.p
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 text-sm text-destructive text-center"
                            >
                              {error}
                            </motion.p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right decorator — mirror of left */}
                <div className="hidden md:flex flex-1 flex-col border-l border-black/10 dark:border-white/10">
                  <div
                    className="shrink-0 border-b border-black/10 dark:border-white/10"
                    style={{ height: HERO_H }}
                  />
                  <div
                    className="shrink-0 border-b border-black/10 dark:border-white/10"
                    style={{ height: INPUT_H }}
                  />
                  <div className="flex-1" />
                </div>
              </div>
            </div>
          </main>
        </BackgroundBeamsWithCollision>
      </SidebarInset>
    </SidebarProvider>
  )
}
