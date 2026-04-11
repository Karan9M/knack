'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MovingBorder } from '@/components/ui/moving-border'
import { SparkleIcon } from '@/components/ui/sparkle-icon'

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

interface HobbyInputBarProps {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  autoFocus?: boolean
}

export function HobbyInputBar({ value, onChange, onSubmit, autoFocus }: HobbyInputBarProps) {
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length), 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const canSubmit = value.trim().length >= 2

  return (
    <div className="relative w-full min-w-0 rounded-2xl border border-border p-[1.5px] shadow-sm">
      {/* Animated border glow */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <MovingBorder duration={7000} rx="50%" ry="50%">
          <div className="h-20 w-20 bg-[radial-gradient(circle,oklch(0.6171_0.1375_39)_0%,oklch(0.74_0.13_55)_50%,transparent_80%)] opacity-80" />
        </MovingBorder>
      </div>

      <div
        className={cn(
          'relative flex h-[58px] min-w-0 items-center gap-2 rounded-[calc(1rem-1px)] bg-card px-2.5 sm:h-[62px] sm:gap-3 sm:px-5'
        )}
      >
        <SparkleIcon size={16} className="shrink-0 text-primary/50 sm:h-[18px] sm:w-[18px]" />
        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && onSubmit()}
            placeholder={PLACEHOLDERS[placeholderIdx]}
            maxLength={100}
            className={cn(
              'w-full min-w-0 bg-transparent text-[0.9375rem] text-foreground sm:text-[1.0625rem]',
              'placeholder:text-muted-foreground/30',
              'focus:outline-none leading-snug'
            )}
            aria-label="Enter your hobby"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-label="Build my roadmap"
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background sm:h-9 sm:w-9',
            'transition-all duration-150',
            'disabled:cursor-not-allowed disabled:opacity-20',
            'hover:opacity-75 active:scale-95'
          )}
        >
          <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>
    </div>
  )
}
