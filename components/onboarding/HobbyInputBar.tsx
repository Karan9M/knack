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
    <div className="relative p-[1.5px] rounded-2xl overflow-hidden shadow-sm border border-border w-full">
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-2xl">
        <MovingBorder duration={7000} rx="50%" ry="50%">
          <div className="h-20 w-20 bg-[radial-gradient(circle,oklch(0.6171_0.1375_39)_0%,oklch(0.74_0.13_55)_50%,transparent_80%)] opacity-80" />
        </MovingBorder>
      </div>

      <div className="relative flex items-center gap-3 bg-card rounded-[calc(1rem-1px)] px-5 h-[62px]">
        <SparkleIcon size={18} className="text-primary/50 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && canSubmit && onSubmit()}
          placeholder={PLACEHOLDERS[placeholderIdx]}
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
          onClick={onSubmit}
          disabled={!canSubmit}
          aria-label="Build my roadmap"
          className={cn(
            'h-9 w-9 rounded-full bg-foreground text-background shrink-0',
            'flex items-center justify-center',
            'transition-all duration-150',
            'disabled:opacity-20 disabled:cursor-not-allowed',
            'hover:opacity-75 active:scale-95'
          )}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
