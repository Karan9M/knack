'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { KnackIcon } from '@/components/layout/KnackIcon'
import type { UserPreferences, ImageStyle, LearningMode, SessionLength } from '@/types'

const QUESTIONS = [
  {
    id: 'imageStyle' as const,
    title: 'What visual style speaks to you?',
    subtitle: "We'll illustrate every technique in your preferred style.",
    options: [
      {
        value: 'illustrations' as ImageStyle,
        label: 'Illustrations',
        icon: '🎨',
        desc: 'Clean vector art',
      },
      {
        value: 'cartoons' as ImageStyle,
        label: 'Cartoons',
        icon: '🎭',
        desc: 'Playful & colorful',
      },
      {
        value: 'ghibli' as ImageStyle,
        label: 'Ghibli',
        icon: '🌸',
        desc: 'Painterly & soft',
      },
      {
        value: 'diagrams' as ImageStyle,
        label: 'Diagrams',
        icon: '📐',
        desc: 'Clear & technical',
      },
      {
        value: 'flowcharts' as ImageStyle,
        label: 'Flowcharts',
        icon: '🔀',
        desc: 'Structured & minimal',
      },
    ],
  },
  {
    id: 'learningMode' as const,
    title: 'How do you learn best?',
    subtitle: "We'll tailor your content mix to match your style.",
    options: [
      {
        value: 'videos' as LearningMode,
        label: 'Watch & observe',
        icon: '🎬',
        desc: 'Video tutorials',
      },
      {
        value: 'reading' as LearningMode,
        label: 'Read & reflect',
        icon: '📚',
        desc: 'Written guides',
      },
      {
        value: 'hands-on' as LearningMode,
        label: 'Hands-on',
        icon: '🛠️',
        desc: 'Direct practice',
      },
      {
        value: 'mixed' as LearningMode,
        label: 'Mix it all',
        icon: '🔄',
        desc: 'A bit of everything',
      },
    ],
  },
  {
    id: 'sessionLength' as const,
    title: 'How long are your practice sessions?',
    subtitle: "We'll estimate realistic hours for each technique.",
    options: [
      {
        value: 'quick' as SessionLength,
        label: 'Quick bursts',
        icon: '⚡',
        desc: '15 – 20 min',
      },
      {
        value: 'regular' as SessionLength,
        label: 'Focused sessions',
        icon: '🎯',
        desc: '30 – 45 min',
      },
      {
        value: 'deep' as SessionLength,
        label: 'Deep work',
        icon: '🔬',
        desc: '1 – 2 hours',
      },
    ],
  },
] as const

type AnswerMap = Partial<UserPreferences>

interface PreferenceQuizProps {
  onComplete: (prefs: UserPreferences) => void
}

interface OptionCardProps {
  icon: string
  label: string
  desc: string
  selected: boolean
  onClick: () => void
  delay: number
  reduced: boolean
}

function OptionCard({ icon, label, desc, selected, onClick, delay, reduced }: OptionCardProps) {
  return (
    <motion.button
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left',
        'transition-all duration-200 cursor-pointer w-full',
        selected
          ? 'border-primary bg-primary/8 shadow-sm'
          : 'border-black/10 dark:border-white/10 hover:border-black/25 dark:hover:border-white/20 hover:bg-black/2 dark:hover:bg-white/3'
      )}
    >
      {/* Selected indicator dot */}
      <span
        className={cn(
          'absolute top-3 right-3 h-2 w-2 rounded-full transition-all duration-200',
          selected ? 'bg-primary scale-100' : 'bg-black/10 dark:bg-white/10 scale-75'
        )}
      />

      <span className="text-2xl leading-none">{icon}</span>
      <span
        className={cn(
          'text-sm font-semibold leading-tight transition-colors',
          selected ? 'text-primary' : 'text-foreground'
        )}
      >
        {label}
      </span>
      <span className="text-xs text-muted-foreground leading-tight">{desc}</span>
    </motion.button>
  )
}

function AnalysisScreen({ reduced, onDone }: { reduced: boolean; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      key="analysis"
      initial={reduced ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35 }}
      className="flex min-h-0 flex-1 w-full flex-col items-center justify-center gap-8 px-4 py-8 text-center"
    >
      {/* Knack logo: orbital rings only (no orbiting dot) */}
      <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full border border-primary/20"
          animate={reduced ? {} : { rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-4 rounded-full border border-dashed border-primary/35"
          animate={reduced ? {} : { rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          animate={reduced ? {} : { scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <KnackIcon size={40} />
        </motion.div>
      </div>

      <div className="flex flex-col gap-2 max-w-xs">
        <h2 className="text-2xl font-bold text-foreground">Nice choices.</h2>
        <p className="text-sm font-light text-muted-foreground leading-relaxed">
          We&apos;re personalising your learning experience — tailored content, matched visuals, and
          the right pace for you.
        </p>
      </div>

      {/* Animated progress dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary"
            animate={reduced ? {} : { opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export function PreferenceQuiz({ onComplete }: PreferenceQuizProps) {
  const reduced = useReducedMotion() ?? false
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [direction, setDirection] = useState(1)

  const currentQuestion = step <= 3 ? QUESTIONS[step - 1] : null

  const handleSelect = (field: keyof UserPreferences, value: string) => {
    const updated = { ...answers, [field]: value }
    setAnswers(updated)
    setDirection(1)
    setTimeout(() => {
      if (step < 3) {
        setStep((s) => (s + 1) as 1 | 2 | 3 | 4)
      } else {
        setStep(4)
      }
    }, 280)
  }

  const handleBack = () => {
    if (step <= 1) return
    setDirection(-1)
    setStep((s) => (s - 1) as 1 | 2 | 3 | 4)
  }

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 32 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -24 }),
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col w-full">
      {/* ── Progress bar ─────────────────────────────────────────────── */}
      <div className="relative h-[3px] w-full bg-black/6 dark:bg-white/8 shrink-0">
        <motion.div
          className="absolute inset-y-0 left-0 bg-primary rounded-full"
          animate={{ width: `${(Math.min(step, 3) / 3) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
      </div>

      {/* ── Step content ─────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {step <= 3 && currentQuestion && (
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex h-full min-h-0 flex-col px-8 py-10"
            >
              {/* Step label */}
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-6">
                {step} of 3
              </p>

              {/* Question */}
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground/90 leading-tight mb-2">
                {currentQuestion.title}
              </h2>
              <p className="text-sm font-light text-muted-foreground mb-8">
                {currentQuestion.subtitle}
              </p>

              {/* Options grid */}
              <div
                className={cn(
                  'grid gap-3',
                  currentQuestion.options.length >= 4
                    ? 'grid-cols-2 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-3'
                )}
              >
                {currentQuestion.options.map((opt, i) => (
                  <OptionCard
                    key={opt.value}
                    icon={opt.icon}
                    label={opt.label}
                    desc={opt.desc}
                    selected={answers[currentQuestion.id] === opt.value}
                    onClick={() => handleSelect(currentQuestion.id, opt.value)}
                    delay={reduced ? 0 : 0.05 + i * 0.05}
                    reduced={reduced}
                  />
                ))}
              </div>

              {/* Back link */}
              {step > 1 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleBack}
                  className="mt-8 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors self-start"
                >
                  ← Back
                </motion.button>
              )}
            </motion.div>
          )}

          {step === 4 && (
            <AnalysisScreen
              reduced={reduced}
              onDone={() => {
                if (answers.imageStyle && answers.learningMode && answers.sessionLength) {
                  onComplete(answers as UserPreferences)
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
