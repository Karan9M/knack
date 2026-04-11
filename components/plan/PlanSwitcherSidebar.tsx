'use client'

import { memo } from 'react'
import { useRouter } from 'next/navigation'
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
import { formatPlanLevelJourney } from '@/lib/skillLevels'
import type { SkillLevel } from '@/types'

export interface PlanSummary {
  id: string
  hobby: string
  currentLevel: SkillLevel
  targetLevel: SkillLevel
  masteredCount: number
  totalCount: number
}

interface PlanSwitcherSidebarProps {
  currentPlanId: string
  currentHobby: string
  currentLevel: SkillLevel
  targetLevel: SkillLevel
  masteredCount: number
  totalCount: number
  allPlans: PlanSummary[]
}

export const PlanSwitcherSidebar = memo(function PlanSwitcherSidebar({
  currentPlanId,
  currentHobby,
  currentLevel,
  targetLevel,
  masteredCount,
  totalCount,
  allPlans,
}: PlanSwitcherSidebarProps) {
  const router = useRouter()
  const pct = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0
  const otherPlans = allPlans.filter((p) => p.id !== currentPlanId)

  return (
    <Sidebar collapsible="icon">
      {/* ── Header: collapse trigger only ─────────────────────────────── */}
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <div className="flex items-center justify-end pr-4 h-12">
          <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground " />
        </div>
      </SidebarHeader>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <SidebarContent>
        {/* Current plan */}
        <SidebarGroup className="pt-4">
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] tracking-widest uppercase font-semibold text-muted-foreground/50 px-4 mb-1">
            Current
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive
                  tooltip={currentHobby}
                  className="h-auto py-3 px-3 cursor-default data-[active=true]:bg-primary/10 data-[active=true]:text-primary group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[12px] font-bold uppercase text-primary">
                    {currentHobby[0]}
                  </span>
                  <span className="group-data-[collapsible=icon]:hidden min-w-0 flex flex-col gap-0.5">
                    <span className="text-sm font-semibold capitalize text-sidebar-foreground leading-tight truncate">
                      {currentHobby}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {formatPlanLevelJourney(currentLevel, targetLevel)}
                    </span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Other plans */}
        {otherPlans.length > 0 && (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-[10px] tracking-widest uppercase font-semibold text-muted-foreground/50 px-4 mb-1">
              Switch plan
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {otherPlans.map((p) => {
                  const pPct =
                    p.totalCount > 0 ? Math.round((p.masteredCount / p.totalCount) * 100) : 0
                  return (
                    <SidebarMenuItem key={p.id}>
                      <SidebarMenuButton
                        onClick={() => router.push(`/plan/${p.id}`)}
                        tooltip={p.hobby}
                        className="h-auto py-2.5 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto"
                      >
                        {/* Avatar with mini progress ring via border trick */}
                        <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold uppercase text-muted-foreground">
                          {p.hobby[0]}
                          {/* Tiny progress arc overlay */}
                          {pPct > 0 && (
                            <span
                              className="absolute inset-0 rounded-full border-2 border-primary/50"
                              style={{ clipPath: `inset(0 ${100 - pPct}% 0 0)` }}
                              aria-hidden
                            />
                          )}
                        </span>
                        <span className="group-data-[collapsible=icon]:hidden min-w-0 flex flex-col gap-0.5">
                          <span className="text-sm font-medium capitalize text-sidebar-foreground leading-tight truncate">
                            {p.hobby}
                          </span>
                          <span className="text-xs text-muted-foreground leading-tight">
                            {p.masteredCount}/{p.totalCount} mastered
                          </span>
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Footer: overall progress ───────────────────────────────────── */}
      <SidebarFooter className="border-t border-sidebar-border p-0">
        {/* Expanded */}
        <div className="group-data-[collapsible=icon]:hidden flex flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {masteredCount} of {totalCount} mastered
            </span>
            <span className="text-xs font-semibold tabular-nums text-foreground/70">{pct}%</span>
          </div>
          <div className="h-[3px] w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Collapsed: thin bar */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-3">
          <div className="h-1.5 w-5 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
})
