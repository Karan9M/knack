'use client'

import { useState } from 'react'
import { LEARNING_PREFERENCE_SECTIONS } from '@/constants/preferenceQuestions'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { UserPreferences } from '@/types'

const DEFAULT_PREFERENCES: UserPreferences = {
  imageStyle: 'illustrations',
  learningMode: 'mixed',
  sessionLength: 'regular',
}

interface LearningPreferencesSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LearningPreferencesSheet({ open, onOpenChange }: LearningPreferencesSheetProps) {
  const setPreferences = useUIStore((s) => s.setPreferences)
  const [draft, setDraft] = useState<UserPreferences>(DEFAULT_PREFERENCES)

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(useUIStore.getState().preferences ?? DEFAULT_PREFERENCES)
    }
    onOpenChange(next)
  }

  const handleSave = () => {
    setPreferences(draft)
    handleOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>Learning preferences</SheetTitle>
          <SheetDescription>
            New lessons and images use these settings. Your current roadmap stays as-is until you
            open or regenerate content.
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto px-4 pb-4">
          {LEARNING_PREFERENCE_SECTIONS.map((section) => (
            <section key={section.id} className="flex flex-col gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{section.subtitle}</p>
              </div>
              <div
                className={cn(
                  'grid gap-2',
                  section.options.length >= 4 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'
                )}
              >
                {section.options.map((opt) => {
                  const selected = draft[section.id] === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          [section.id]: opt.value,
                        }))
                      }
                      className={cn(
                        'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-primary/40',
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/35 hover:text-foreground'
                      )}
                    >
                      <span className="text-lg leading-none">{opt.icon}</span>
                      <span className={cn('text-xs font-semibold', selected && 'text-primary')}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] leading-tight opacity-80">{opt.desc}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <SheetFooter className="border-t border-border pt-4">
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="button" className="flex-1" onClick={handleSave}>
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
