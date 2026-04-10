'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MovingBorder } from '@/components/ui/moving-border'
import { SparkleIcon } from '@/components/ui/sparkle-icon'

interface HobbyInputProps {
  onSubmit: (hobby: string) => void
  isVisible: boolean
}

const PLACEHOLDERS = [
  'chess',
  'fingerstyle guitar',
  'oil painting',
  'Brazilian jiu-jitsu',
  'poker',
  'watercolor',
  'rock climbing',
  'jazz piano',
]

const SUGGESTIONS = ['Chess', 'Fingerstyle guitar', 'Poker', 'Rock climbing', 'Oil painting']

export function HobbyInput({ onSubmit, isVisible }: HobbyInputProps) {
  const [value, setValue] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % PLACEHOLDERS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isVisible) inputRef.current?.focus()
  }, [isVisible])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed.length < 2) return
    onSubmit(trimmed)
  }

  const handleSuggestion = (s: string) => {
    setValue(s)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <motion.div
      initial={prefersReduced ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReduced ? undefined : { opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full flex flex-col"
    >
      {/* Heading block */}
      <div className="mb-10">
        <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-4">
          AI-powered skill roadmaps
        </p>
        <h1 className="text-5xl sm:text-[3.5rem] font-bold text-foreground/90 leading-[1.08] tracking-tight">
          What do you want
          <br />
          to <em className="not-italic text-primary">master?</em>
        </h1>
        <p className="mt-5 text-muted-foreground text-base leading-relaxed max-w-md">
          Stop spiralling through YouTube. Pick any hobby and we&apos;ll map exactly 5–8 techniques
          for your level — focused learning that actually moves the needle.
        </p>
      </div>

      {/* Input bar — moving border only, no static border artifact */}
      <div className="relative p-[1.5px] rounded-2xl overflow-hidden shadow-lg border border-border">
        {/* Animated border — sole border treatment */}
        <div className="absolute inset-0 rounded-2xl">
          <MovingBorder duration={7000} rx="50%" ry="50%">
            <div className="h-20 w-20 bg-[radial-gradient(circle,oklch(0.6171_0.1375_39)_0%,oklch(0.74_0.13_55)_50%,transparent_80%)] opacity-80" />
          </MovingBorder>
        </div>

        {/* Input row */}
        <div className="relative flex items-center gap-3 bg-card rounded-[calc(1rem-1px)] px-5 h-[62px]">
          <SparkleIcon size={18} className="text-primary/50 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={PLACEHOLDERS[placeholderIndex]}
            maxLength={100}
            className={cn(
              'flex-1 text-[1.0625rem] text-foreground bg-transparent',
              'placeholder:text-muted-foreground/30',
              'focus:outline-none leading-none'
            )}
            aria-label="Enter your hobby"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={handleSubmit}
            disabled={value.trim().length < 2}
            aria-label="Build my roadmap"
            className={cn(
              'h-9 w-9 rounded-full bg-foreground text-background',
              'flex items-center justify-center shrink-0',
              'transition-all duration-150',
              'disabled:opacity-20 disabled:cursor-not-allowed',
              'hover:opacity-75 active:scale-95'
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Suggestion links — spacious, tappable */}
      <div className="mt-4 flex flex-col">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s}
            initial={prefersReduced ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.12 + i * 0.06 }}
            onClick={() => handleSuggestion(s)}
            className={cn(
              'flex items-center gap-3 py-3.5 text-sm text-muted-foreground',
              'hover:text-foreground transition-colors duration-150 text-left group',
              'border-b border-border/40 last:border-0'
            )}
          >
            <ArrowRight className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-80 transition-opacity" />
            {s}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
