'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface StreakBadgeProps {
  count: number
}

export function StreakBadge({ count }: StreakBadgeProps) {
  const prefersReduced = useReducedMotion()

  if (count === 0) return null

  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200"
      aria-label={`${count} day streak`}
    >
      <span className="text-sm leading-none" aria-hidden>
        🔥
      </span>
      <AnimatePresence mode="wait">
        <motion.span
          key={count}
          initial={prefersReduced ? false : { opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReduced ? undefined : { opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
          className="text-sm font-bold text-amber-700 tabular-nums leading-none"
        >
          {count}
        </motion.span>
      </AnimatePresence>
      <span className="text-xs text-amber-600 font-medium leading-none">
        {count === 1 ? 'day' : 'days'}
      </span>
    </div>
  )
}
