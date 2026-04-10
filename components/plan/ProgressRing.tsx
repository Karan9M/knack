'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface ProgressRingProps {
  mastered: number
  total: number
  size?: number
}

export function ProgressRing({ mastered, total, size = 72 }: ProgressRingProps) {
  const prefersReduced = useReducedMotion()
  const strokeWidth = 4
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? mastered / total : 0
  const offset = circumference - progress * circumference

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${mastered} of ${total} techniques mastered`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[1.375rem] font-bold text-foreground leading-none tabular-nums tracking-tight">
          {mastered}
        </span>
        <span className="text-[11px] text-muted-foreground/85 leading-none mt-1 tabular-nums tracking-wide">
          /{total}
        </span>
      </div>
    </div>
  )
}
