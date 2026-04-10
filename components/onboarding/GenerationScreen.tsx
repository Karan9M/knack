'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { KnackIcon } from '@/components/layout/KnackIcon'

interface GenerationScreenProps {
  hobby: string
}

const STEPS = ['Analysing skill progression', 'Selecting key techniques', 'Crafting your roadmap']

export function GenerationScreen({ hobby }: GenerationScreenProps) {
  const reduced = useReducedMotion() ?? false

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center gap-8 py-16 text-center"
    >
      {/* ── Animated KnackIcon with orbital rings ── */}
      <div className="relative flex items-center justify-center h-28 w-28">
        {/* Slow outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-primary/20"
          animate={reduced ? {} : { rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />
        {/* Dashed counter-ring */}
        <motion.div
          className="absolute inset-4 rounded-full border border-dashed border-primary/30"
          animate={reduced ? {} : { rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
        {/* Orbiting dot */}
        {!reduced && (
          <motion.div
            className="absolute h-2.5 w-2.5 rounded-full bg-primary"
            style={{ top: 0, left: '50%', marginLeft: -5, marginTop: -5 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            transformTemplate={({ rotate }) =>
              `rotate(${rotate}) translateY(-56px) rotate(-${rotate})`
            }
          />
        )}
        {/* Icon with breathe */}
        <motion.div
          animate={reduced ? {} : { scale: [1, 1.1, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <KnackIcon size={38} />
        </motion.div>
      </div>

      {/* ── Copy ── */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-foreground">Building your roadmap</h2>
        <p className="text-sm font-light text-muted-foreground max-w-xs mx-auto">
          Crafting a focused <span className="font-medium text-foreground">{hobby}</span> plan just
          for you…
        </p>
      </div>

      {/* ── Step list ── */}
      <div className="flex flex-col gap-2.5 w-full max-w-xs text-left">
        {STEPS.map((step, i) => (
          <motion.div
            key={step}
            className="flex items-center gap-3 text-sm"
            initial={reduced ? false : { opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.5, duration: 0.3 }}
          >
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-primary shrink-0"
              animate={reduced ? {} : { scale: [0.8, 1.4, 0.8] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5 }}
            />
            <span className="text-muted-foreground">{step}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
