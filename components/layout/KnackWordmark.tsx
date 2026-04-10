'use client'

import { cn } from '@/lib/utils'
import { motion, useReducedMotion } from 'framer-motion'

interface KnackWordmarkProps {
  className?: string
  height?: number
}

// Each letter's SVG path data, split from the original compound path so
// individual letters can be animated independently.
// 'a' and 'k' each need two sub-paths (outer shape + counter / stem + diagonal)
// kept together inside one <motion.g> so the fill-rule creates the correct cutout.
const LETTERS = [
  {
    id: 'K',
    d: 'M0 49.60L0 14.60L7.50 14.60L7.50 27.85L19.60 14.60L28.80 14.60L15.95 28.45L29.25 49.60L20.05 49.60L10.60 34.25L7.50 37.60L7.50 49.60L0 49.60Z',
  },
  {
    id: 'n',
    d: 'M33.60 49.60L33.60 24.40L40.15 24.40L40.75 28.45L40.75 28.45Q41.90 26.35 44 25.07Q46.10 23.80 49.10 23.80Q52.25 23.80 54.40 25.15Q56.55 26.50 57.68 29.02Q58.80 31.55 58.80 35.20L58.80 49.60L51.35 49.60L51.35 35.90Q51.35 33.15 50.18 31.63Q49 30.10 46.45 30.10Q44.95 30.10 43.73 30.82Q42.50 31.55 41.80 32.90Q41.10 34.25 41.10 36.15L41.10 49.60L33.60 49.60Z',
  },
  {
    // outer shape + inner counter — same path element so evenodd fill-rule punches the counter
    id: 'a',
    d: 'M73.65 50.20Q70.50 50.20 68.43 49.20Q66.35 48.20 65.38 46.48Q64.40 44.75 64.40 42.65Q64.40 40.40 65.53 38.67Q66.65 36.95 69.05 35.92Q71.45 34.90 75.10 34.90L81.20 34.90Q81.20 33.20 80.78 32.10Q80.35 31 79.40 30.45Q78.45 29.90 76.80 29.90Q75.05 29.90 73.85 30.60Q72.65 31.30 72.35 32.80L65.15 32.80Q65.40 30.10 66.93 28.10Q68.45 26.10 71 24.95Q73.55 23.80 76.85 23.80Q80.45 23.80 83.10 24.98Q85.75 26.15 87.23 28.40Q88.70 30.65 88.70 34L88.70 49.60L82.45 49.60L81.55 45.95L81.55 45.95Q81 46.90 80.25 47.68Q79.50 48.45 78.50 49.02Q77.50 49.60 76.30 49.90Q75.10 50.20 73.65 50.20M75.50 44.50Q76.70 44.50 77.60 44.10Q78.50 43.70 79.15 43Q79.80 42.30 80.23 41.38Q80.65 40.45 80.85 39.35L80.85 39.30L76 39.30Q74.75 39.30 73.93 39.63Q73.10 39.95 72.70 40.55Q72.30 41.15 72.30 41.95Q72.30 42.80 72.73 43.38Q73.15 43.95 73.88 44.23Q74.60 44.50 75.50 44.50Z',
  },
  {
    id: 'c',
    d: 'M107.40 50.20Q103.50 50.20 100.53 48.50Q97.55 46.80 95.88 43.85Q94.20 40.90 94.20 37.10Q94.20 33.20 95.88 30.23Q97.55 27.25 100.53 25.52Q103.50 23.80 107.40 23.80Q112.35 23.80 115.73 26.40Q119.10 29 120 33.65L112.05 33.65Q111.60 32.05 110.35 31.15Q109.10 30.25 107.35 30.25Q105.70 30.25 104.48 31.07Q103.25 31.90 102.55 33.42Q101.85 34.95 101.85 37Q101.85 38.55 102.25 39.80Q102.65 41.05 103.38 41.95Q104.10 42.85 105.10 43.33Q106.10 43.80 107.35 43.80Q108.55 43.80 109.48 43.40Q110.40 43 111.08 42.25Q111.75 41.50 112.05 40.40L120 40.40Q119.10 44.90 115.70 47.55Q112.30 50.20 107.40 50.20Z',
  },
  {
    // diagonal parts + stem kept together so they move as one glyph
    id: 'k',
    d: 'M142.60 49.60L132.20 35.80L141.45 24.40L150.30 24.40L137.85 39L137.85 33L151.90 49.60L142.60 49.60M125.80 49.60L125.80 13.60L133.30 13.60L133.30 49.60L125.80 49.60Z',
  },
]

// Parent triggers the "hover" variant; staggerChildren cascades into each letter group.
const containerVariants = {
  rest: { transition: { staggerChildren: 0.035 } },
  hover: { transition: { staggerChildren: 0.035 } },
}

const letterVariants = {
  rest: {
    y: 0,
    transition: { type: 'spring' as const, stiffness: 600, damping: 30 },
  },
  hover: {
    y: -2.5,
    transition: { type: 'spring' as const, stiffness: 500, damping: 18 },
  },
}

export function KnackWordmark({ className, height = 20 }: KnackWordmarkProps) {
  const prefersReduced = useReducedMotion()

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 13.6 151.9 36.6"
      height={height}
      fill="currentColor"
      aria-label="Knack"
      role="img"
      className={cn('overflow-visible cursor-default select-none', className)}
      initial="rest"
      whileHover={prefersReduced ? undefined : 'hover'}
      animate="rest"
      variants={containerVariants}
    >
      {LETTERS.map((letter) => (
        <motion.g key={letter.id} variants={prefersReduced ? undefined : letterVariants}>
          <path d={letter.d} />
        </motion.g>
      ))}
    </motion.svg>
  )
}
