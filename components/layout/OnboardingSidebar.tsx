'use client'

import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Sidebar,
  SidebarContent,
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
import { KnackIcon } from '@/components/layout/KnackIcon'
import { KnackWordmark } from '@/components/layout/KnackWordmark'
import type { SkillLevel } from '@/types'

interface PastPlan {
  id: string
  hobby: string
  currentLevel: SkillLevel
  targetLevel: SkillLevel
  lastActiveAt: string
  masteredCount: number
  totalCount: number
}

interface OnboardingSidebarProps {
  pastPlans: PastPlan[]
  showPlans: boolean
}

export function OnboardingSidebar({ pastPlans, showPlans }: OnboardingSidebarProps) {
  const router = useRouter()

  return (
    <Sidebar collapsible="icon">
      {/* ── Logo ── */}
      <SidebarHeader className="border-b border-sidebar-border h-12 p-0">
        {/* Expanded: icon + wordmark + collapse trigger */}
        <div className="group-data-[collapsible=icon]:hidden flex items-center h-12 px-4 gap-3">
          <KnackIcon size={20} className="shrink-0" />
          <KnackWordmark height={18} className="text-sidebar-foreground" />
          <SidebarTrigger className="ml-auto h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors" />
        </div>
        {/* Icon-only: KnackIcon centred — SidebarRail handles expand on click */}
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center h-12">
          <KnackIcon size={20} />
        </div>
      </SidebarHeader>

      {/* ── Past plans ── */}
      <SidebarContent>
        <AnimatePresence>
          {showPlans && pastPlans.length > 0 && (
            <motion.div
              key="past-plans"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SidebarGroup className="pt-4">
                <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden mb-2 text-xs tracking-widest uppercase font-semibold text-muted-foreground/70 px-4">
                  Resume a roadmap
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1">
                    {pastPlans.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: 0.05 + i * 0.06 }}
                      >
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => router.push(`/plan/${p.id}`)}
                            tooltip={`${p.hobby} — ${p.masteredCount}/${p.totalCount} mastered`}
                            className="h-auto data-[active=true]:bg-primary/10 data-[active=true]:text-primary items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto gap-2 justify-left"
                          >
                            {/* Avatar circle — centred in icon-only mode */}
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold uppercase text-primary text-center leading-none">
                              {p.hobby[0]}
                            </span>

                            {/* Text — hidden in icon-only mode */}
                            <span className="group-data-[collapsible=icon]:hidden min-w-0 flex flex-col gap-0.5">
                              <span className="truncate text-sm font-semibold capitalize text-sidebar-foreground leading-tight">
                                {p.hobby}
                              </span>
                              <span className="text-xs text-muted-foreground leading-tight">
                                {p.masteredCount}/{p.totalCount} mastered
                              </span>
                            </span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </motion.div>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
