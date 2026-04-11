'use client'

import { memo } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { StreakBadge } from '@/components/plan/StreakBadge'
import { SKILL_LEVEL_LABELS } from '@/constants'
import type { Plan, Technique, StreakData } from '@/types'

interface CourseSidebarProps {
  plan: Plan
  selectedId: string | null
  onSelect: (id: string) => void
  masteredCount: number
  streak: StreakData
}

export const CourseSidebar = memo(
  function CourseSidebar({
    plan,
    selectedId,
    onSelect,
    masteredCount,
    streak,
  }: CourseSidebarProps) {
    const total = plan.techniques.length
    const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0

    return (
      <Sidebar collapsible="icon">
        {/* ── Header — exact h-12 to align with main content header ─── */}
        <SidebarHeader className="border-b border-sidebar-border p-0">
          {/* Expanded: level + title + trigger (right-aligned) */}
          <div className="group-data-[collapsible=icon]:hidden flex items-center h-12 px-3 gap-2 min-w-0">
            <div className="flex flex-col justify-center flex-1 min-w-0 overflow-hidden">
              <p className="flex items-center gap-1 text-[9px] font-semibold tracking-widest uppercase text-muted-foreground/70 leading-none mb-0.5">
                <span>{SKILL_LEVEL_LABELS[plan.currentLevel]}</span>
                <span className="text-primary">→</span>
                <span>{SKILL_LEVEL_LABELS[plan.targetLevel]}</span>
              </p>
              <h2 className="text-sm font-bold text-sidebar-foreground capitalize leading-tight truncate">
                {plan.hobby}
              </h2>
            </div>
            {/* Trigger lives in the sidebar — desktop only */}
            <SidebarTrigger className="hidden md:flex shrink-0 text-muted-foreground hover:text-foreground" />
          </div>

          {/* Icon-only: just the trigger, perfectly centred */}
          <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center h-12">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
          </div>
        </SidebarHeader>

        {/* ── Technique list ──────────────────────────────────────── */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden px-4 text-muted-foreground/60 text-[10px] tracking-widest uppercase">
              Techniques
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {plan.techniques.map((technique, index) => (
                  <TechniqueItem
                    key={technique.id}
                    id={technique.id}
                    name={technique.name}
                    status={technique.status}
                    index={index}
                    isSelected={selectedId === technique.id}
                    onSelect={onSelect}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <SidebarFooter className="border-t border-sidebar-border p-0">
          {/* Expanded: progress bar + mastered count + streak */}
          <div className="group-data-[collapsible=icon]:hidden flex flex-col gap-2.5 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {masteredCount} of {total} mastered
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

          {/* Icon-only: flame + count stacked */}
          <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center justify-center gap-0.5 py-3">
            {streak.count > 0 ? (
              <>
                <span className="text-base leading-none" aria-hidden>
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
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>
    )
  },
  (prev, next) => {
    if (prev.selectedId !== next.selectedId) return false
    if (prev.masteredCount !== next.masteredCount) return false
    if (prev.streak.count !== next.streak.count) return false
    if (prev.plan.techniques.length !== next.plan.techniques.length) return false
    for (let i = 0; i < prev.plan.techniques.length; i++) {
      if (prev.plan.techniques[i].status !== next.plan.techniques[i].status) return false
      if (prev.plan.techniques[i].name !== next.plan.techniques[i].name) return false
    }
    return true
  }
)

interface TechniqueItemProps {
  id: string
  name: string
  status: Technique['status']
  index: number
  isSelected: boolean
  onSelect: (id: string) => void
}

const TechniqueItem = memo(function TechniqueItem({
  id,
  name,
  status,
  index,
  isSelected,
  onSelect,
}: TechniqueItemProps) {
  const isMastered = status === 'mastered'
  const isSkipped = status === 'skipped'

  return (
    <SidebarMenuItem className="group-data-[collapsible=icon]:py-0.5">
      <SidebarMenuButton
        onClick={() => onSelect(id)}
        isActive={isSelected}
        tooltip={name}
        className={cn(
          'py-2.5 h-auto',
          // Centre the badge within the icon-rail cell — prevents highlight bleeding
          'group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:justify-center',
          'data-[active=true]:bg-primary/10 data-[active=true]:text-primary',
          'group-data-[collapsible=icon]:data-[active=true]:bg-transparent',
          isSkipped && 'opacity-40'
        )}
      >
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
        <span className={cn('text-sm leading-snug', isSkipped && 'line-through')}>{name}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
})
