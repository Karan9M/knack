'use client'

import { memo } from 'react'
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StreakBadge } from '@/components/plan/StreakBadge'
import type { Technique, StreakData } from '@/types'

interface TechniqueNavPanelProps {
  techniques: Technique[]
  selectedId: string | null
  onSelect: (id: string) => void
  masteredCount: number
  streak: StreakData
  open: boolean
  onToggle: () => void
}

export const TechniqueNavPanel = memo(
  function TechniqueNavPanel({
    techniques,
    selectedId,
    onSelect,
    masteredCount,
    streak,
    open,
    onToggle,
  }: TechniqueNavPanelProps) {
    const total = techniques.length
    const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0

    return (
      <aside
        className={cn(
          'hidden md:flex h-full flex-col shrink-0',
          'border-l border-border bg-background',
          'transition-[width] duration-300 ease-in-out overflow-hidden',
          open ? 'w-56' : 'w-10'
        )}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          className={cn(
            'flex items-center h-12 border-b border-border shrink-0 gap-2',
            open ? 'px-3 justify-between' : 'justify-center'
          )}
        >
          {open && (
            <span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50 select-none">
              Techniques
            </span>
          )}
          <button
            onClick={onToggle}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
            aria-label={open ? 'Collapse technique list' : 'Expand technique list'}
          >
            {open ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* ── Technique list ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-1.5">
          {techniques.map((t, i) => (
            <NavItem
              key={t.id}
              technique={t}
              index={i}
              isSelected={selectedId === t.id}
              onSelect={onSelect}
              showName={open}
            />
          ))}
        </div>

        {/* ── Footer: progress + streak ────────────────────────────────── */}
        {open ? (
          <div className="border-t border-border px-4 py-3 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {masteredCount}/{total} mastered
              </span>
              <span className="text-xs font-semibold tabular-nums text-foreground/70">{pct}%</span>
            </div>
            <div className="h-[3px] w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            {streak.count > 0 && (
              <div className="mt-0.5">
                <StreakBadge count={streak.count} />
              </div>
            )}
          </div>
        ) : (
          /* Collapsed: flame + count or muted bar */
          <div className="border-t border-border flex flex-col items-center justify-center gap-0.5 py-3 shrink-0">
            {streak.count > 0 ? (
              <>
                <span className="text-sm leading-none" aria-hidden>
                  🔥
                </span>
                <span className="text-[10px] font-bold tabular-nums text-amber-500 leading-none">
                  {streak.count}
                </span>
              </>
            ) : (
              <div className="h-[3px] w-5 rounded-full bg-border" aria-hidden />
            )}
          </div>
        )}
      </aside>
    )
  },
  (prev, next) => {
    if (prev.open !== next.open) return false
    if (prev.selectedId !== next.selectedId) return false
    if (prev.masteredCount !== next.masteredCount) return false
    if (prev.streak.count !== next.streak.count) return false
    if (prev.techniques.length !== next.techniques.length) return false
    for (let i = 0; i < prev.techniques.length; i++) {
      if (prev.techniques[i].status !== next.techniques[i].status) return false
    }
    return true
  }
)

// ── NavItem ───────────────────────────────────────────────────────────────────

interface NavItemProps {
  technique: Technique
  index: number
  isSelected: boolean
  onSelect: (id: string) => void
  showName: boolean
}

const NavItem = memo(function NavItem({
  technique,
  index,
  isSelected,
  onSelect,
  showName,
}: NavItemProps) {
  const isMastered = technique.status === 'mastered'
  const isSkipped = technique.status === 'skipped'

  return (
    <button
      onClick={() => onSelect(technique.id)}
      title={!showName ? technique.name : undefined}
      className={cn(
        'w-full flex items-center gap-3 py-2.5 text-left transition-colors select-none',
        showName ? 'px-3' : 'justify-center px-0',
        isSelected ? 'bg-primary/8 text-primary' : 'hover:bg-secondary/50 text-foreground',
        isSkipped && 'opacity-40'
      )}
    >
      {/* Status badge */}
      {isMastered ? (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500">
          <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </span>
      ) : isSkipped ? (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
      ) : (
        <span
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
            'text-[11px] font-bold leading-none tabular-nums',
            isSelected ? 'border-primary text-primary' : 'border-border text-muted-foreground'
          )}
        >
          {index + 1}
        </span>
      )}

      {/* Name — only when panel is expanded */}
      {showName && (
        <span className={cn('text-sm leading-snug truncate', isSkipped && 'line-through')}>
          {technique.name}
        </span>
      )}
    </button>
  )
})
