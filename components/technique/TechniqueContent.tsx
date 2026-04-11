'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ExternalLink,
  Clock,
  ArrowLeft,
  ArrowRight,
  Zap,
  Timer,
  CheckCircle2,
  NotebookPen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { KeyConceptsList } from '@/components/technique/KeyConceptsList'
import { MarkdownContent } from '@/components/technique/MarkdownContent'
import { useTechniqueActions } from '@/hooks/useTechniqueActions'
import { usePlanStore } from '@/store/planStore'
import { useUIStore } from '@/store/uiStore'
import { useTechniqueNotes } from '@/hooks/useTechniqueNotes'
import { TechniqueChat } from '@/components/technique/TechniqueChat'
import { CONTENT_TYPE_LABELS } from '@/constants'
import type { Technique, Plan, PracticeTask } from '@/types'

const VideoEmbed = dynamic(
  () => import('@/components/technique/VideoEmbed').then((m) => m.VideoEmbed),
  {
    ssr: false,
    loading: () => <div className="w-full aspect-video rounded-xl bg-secondary animate-pulse" />,
  }
)

const GeneratedImage = dynamic(
  () => import('@/components/technique/GeneratedImage').then((m) => m.GeneratedImage),
  { ssr: false }
)

function PracticeTaskCard({ task }: { task: PracticeTask }) {
  return (
    <div className="my-8 rounded-2xl border border-primary/25 bg-primary/5 overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-primary/15 bg-primary/8">
        <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-[11px] font-bold tracking-widest uppercase text-primary">
          Today&apos;s Drill
        </span>
      </div>

      {/* Drill instruction */}
      <div className="px-5 pt-4 pb-5">
        <p className="text-base font-medium text-foreground leading-relaxed">{task.drill}</p>

        {/* Duration + success cue chips */}
        <div className="mt-4 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs font-medium text-foreground/70">
            <Timer className="h-3 w-3 text-primary shrink-0" />
            {task.duration}
          </span>
          <span className="inline-flex items-start gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-xs font-medium text-foreground/70">
            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-px" />
            <span>{task.cue}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

interface TechniqueContentProps {
  technique: Technique
  plan: Plan
  onClose?: () => void
  floatingOffsetClass?: string
  /** Hide bottom prev/next strip (e.g. mobile full-screen sheet already has header nav). */
  hideFooterTechniqueNav?: boolean
}

export const TechniqueContent = memo(function TechniqueContent({
  technique,
  plan,
  onClose,
  floatingOffsetClass,
  hideFooterTechniqueNav,
}: TechniqueContentProps) {
  const { markMastered, skipTechnique } = useTechniqueActions()

  const prevNeighborId = usePlanStore((s) => {
    const techs = s.activePlan?.techniques ?? plan.techniques
    const idx = techs.findIndex((t) => t.id === technique.id)
    return idx > 0 ? techs[idx - 1].id : null
  })
  const nextNeighborId = usePlanStore((s) => {
    const techs = s.activePlan?.techniques ?? plan.techniques
    const idx = techs.findIndex((t) => t.id === technique.id)
    return idx >= 0 && idx < techs.length - 1 ? techs[idx + 1].id : null
  })

  const prevTechnique = useMemo(() => {
    if (!prevNeighborId) return null
    const t = plan.techniques.find((x) => x.id === prevNeighborId)
    return t ? { id: t.id, name: t.name } : null
  }, [prevNeighborId, plan.techniques])

  const nextTechnique = useMemo(() => {
    if (!nextNeighborId) return null
    const t = plan.techniques.find((x) => x.id === nextNeighborId)
    return t ? { id: t.id, name: t.name } : null
  }, [nextNeighborId, plan.techniques])

  const setSelectedTechniqueId = useUIStore((s) => s.setSelectedTechniqueId)

  const isMastered = technique.status === 'mastered'
  const isSkipped = technique.status === 'skipped'
  const showVideo = technique.contentType === 'video' || technique.contentType === 'both'
  const showArticles =
    (technique.contentType === 'article' || technique.contentType === 'both') &&
    (technique.resources.articleLinks?.length ?? 0) > 0
  const notes = useTechniqueNotes({ techniqueId: technique.id, initialNotes: technique.notes })
  const [notesOpen, setNotesOpen] = useState(false)
  const notesPanelRef = useRef<HTMLDivElement | null>(null)
  const notesButtonRef = useRef<HTMLButtonElement | null>(null)
  const contentRootRef = useRef<HTMLElement | null>(null)
  const [selectionMenu, setSelectionMenu] = useState<{
    text: string
    x: number
    y: number
  } | null>(null)

  const hideSelectionMenu = useCallback(() => setSelectionMenu(null), [])

  const maybeShowSelectionMenu = useCallback(() => {
    const selection = window.getSelection()
    const selectedText = selection?.toString().trim() ?? ''

    if (!selection || selection.rangeCount === 0 || selectedText.length < 2) {
      setSelectionMenu(null)
      return
    }

    const range = selection.getRangeAt(0)
    const containerNode = range.commonAncestorContainer
    const root = contentRootRef.current
    if (!root) return

    const containerEl =
      containerNode.nodeType === Node.ELEMENT_NODE
        ? (containerNode as Element)
        : containerNode.parentElement

    if (!containerEl || !root.contains(containerEl)) {
      setSelectionMenu(null)
      return
    }

    if (
      containerEl.closest('textarea') ||
      containerEl.closest('input') ||
      containerEl.closest('[contenteditable="true"]')
    ) {
      setSelectionMenu(null)
      return
    }

    const rect = range.getBoundingClientRect()
    if (!rect.width && !rect.height) {
      setSelectionMenu(null)
      return
    }

    setSelectionMenu({
      text: selectedText,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    })
  }, [])

  const saveSelectionToNotes = useCallback(() => {
    if (!selectionMenu) return
    const normalized = selectionMenu.text.replace(/\s+/g, ' ').trim()
    if (!normalized) return
    const next = notes.notes.trim().length
      ? `${notes.notes.trim()}\n• ${normalized}`
      : `• ${normalized}`
    notes.onChange(next)
    window.getSelection()?.removeAllRanges()
    setSelectionMenu(null)
    setNotesOpen(true)
  }, [notes, selectionMenu])

  useEffect(() => {
    if (!notesOpen) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return

      const isInsidePanel = !!notesPanelRef.current?.contains(target)
      const isInsideButton = !!notesButtonRef.current?.contains(target)
      if (!isInsidePanel && !isInsideButton) {
        setNotesOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [notesOpen])

  useEffect(() => {
    const onMouseUp = () => window.setTimeout(maybeShowSelectionMenu, 0)
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key.includes('Arrow')) {
        window.setTimeout(maybeShowSelectionMenu, 0)
      }
    }
    const onScroll = () => hideSelectionMenu()
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return
      const menu = document.getElementById('selection-save-menu')
      if (menu?.contains(target)) return
      hideSelectionMenu()
    }

    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('mousedown', onPointerDown)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [hideSelectionMenu, maybeShowSelectionMenu])

  return (
    <article ref={contentRootRef} className="max-w-2xl mx-auto px-6 md:px-10 py-10 pb-40 md:pb-44">
      {/* Status + meta row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
        <span className="font-medium tracking-wide uppercase">
          {CONTENT_TYPE_LABELS[technique.contentType]}
        </span>
        <span className="text-border">·</span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {technique.estimatedHours}h to learn
        </span>
        {isMastered && (
          <>
            <span className="text-border">·</span>
            <span className="text-emerald-600 font-medium">✓ Mastered</span>
          </>
        )}
        {isSkipped && (
          <>
            <span className="text-border">·</span>
            <span className="text-muted-foreground/60">Skipped</span>
          </>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-4">
        {technique.name}
      </h1>

      {/* Why it matters — intro paragraph */}
      <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-2">
        {technique.whyItMatters}
      </p>

      {/* Today's practice drill — the action gap filler */}
      {technique.practiceTask && <PracticeTaskCard task={technique.practiceTask} />}

      {/* AI-generated illustration — contextual to technique + hobby */}
      <GeneratedImage
        techniqueId={technique.id}
        techniqueName={technique.name}
        hobby={plan.hobby}
        contentType={technique.contentType}
        initialImage={technique.generatedImage}
      />

      {/* Rich AI-generated article */}
      <div className="mt-2">
        <MarkdownContent technique={technique} />
      </div>

      {/* Hook fact — styled as a callout / blockquote */}
      <blockquote className="my-8 border-l-[3px] border-primary/40 pl-5 py-1">
        <p className="text-base italic text-foreground/80 leading-relaxed">{technique.hookFact}</p>
      </blockquote>

      {/* Video embed */}
      {showVideo && (
        <div className="my-8">
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
            Watch
          </p>
          <VideoEmbed
            techniqueId={technique.id}
            videoQuery={technique.resources.videoQuery}
            cachedVideos={technique.resources.videoCache}
          />
        </div>
      )}

      {/* Key concepts */}
      <div className="my-8">
        <KeyConceptsList concepts={technique.keyConcepts} />
      </div>

      {/* Article links */}
      {showArticles && (
        <div className="my-8 flex flex-col gap-2">
          <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-1">
            Read More
          </p>
          {technique.resources.articleLinks?.map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'flex items-center justify-between gap-2 p-3.5 rounded-xl',
                'border border-border bg-card hover:bg-secondary/40 transition-colors'
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug line-clamp-1">
                  {article.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{article.source}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
            </a>
          ))}
        </div>
      )}

      {/* ── Footer: action + desktop prev/next strip ── */}
      <div className="mt-10 pt-8 border-t border-border flex flex-col gap-3">
        {!isMastered ? (
          <>
            <button
              onClick={() => {
                markMastered(technique.id)
                onClose?.()
                // Auto-advance to next on desktop
                if (nextTechnique && !onClose) {
                  setSelectedTechniqueId(nextTechnique.id)
                }
              }}
              className={cn(
                'w-full h-12 rounded-2xl flex items-center justify-center gap-2',
                'bg-primary text-primary-foreground font-semibold text-base',
                'shadow-[0_4px_0_0_oklch(0.48_0.12_39)] active:shadow-none active:translate-y-1',
                'transition-all duration-100 hover:brightness-105'
              )}
            >
              ✓ Mark as Mastered
            </button>

            {!isSkipped && (
              <button
                onClick={() => {
                  skipTechnique(technique.id)
                  onClose?.()
                }}
                className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline text-center"
              >
                Skip this technique
              </button>
            )}
          </>
        ) : !nextTechnique ? (
          <div className="text-center py-3">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              🎉 You&apos;ve mastered all techniques in this roadmap!
            </p>
          </div>
        ) : null}

        {!hideFooterTechniqueNav && (prevTechnique || nextTechnique) && (
          <div className="hidden md:flex min-h-[3.25rem] w-full items-stretch border border-border rounded-2xl overflow-hidden bg-card/30">
            {prevTechnique && (
              <button
                type="button"
                onClick={() => setSelectedTechniqueId(prevTechnique.id)}
                className={cn(
                  'flex flex-1 min-w-0 items-center gap-3 px-4 py-3.5',
                  'hover:bg-secondary/50 transition-colors duration-150 group',
                  nextTechnique && 'border-r border-border'
                )}
                aria-label={`Previous: ${prevTechnique.name}`}
              >
                <ArrowLeft
                  className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors"
                  aria-hidden
                />
                <span className="flex-1 min-w-0 text-center text-sm font-medium text-primary truncate">
                  {prevTechnique.name}
                </span>
              </button>
            )}
            {nextTechnique && (
              <button
                type="button"
                onClick={() => setSelectedTechniqueId(nextTechnique.id)}
                className="flex flex-1 min-w-0 items-center gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors duration-150 group"
                aria-label={`Next: ${nextTechnique.name}`}
              >
                <span className="flex-1 min-w-0 text-center text-sm font-medium text-primary truncate">
                  {nextTechnique.name}
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors"
                  aria-hidden
                />
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className={cn(
          'fixed bottom-6 z-[65] h-[62px] w-12',
          floatingOffsetClass ?? 'right-5',
          'flex items-center justify-center'
        )}
      >
        <button
          ref={notesButtonRef}
          type="button"
          onClick={() => setNotesOpen((v) => !v)}
          className={cn(
            'h-12 w-12 rounded-full shadow-lg',
            'bg-primary text-primary-foreground flex items-center justify-center',
            'hover:brightness-105 transition-all active:scale-95'
          )}
          aria-label={notesOpen ? 'Close notes' : 'Open notes'}
        >
          <NotebookPen className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {!notesOpen && notes.status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={cn(
              'fixed bottom-20 z-[66] rounded-full border px-3 py-1.5 text-xs shadow-md',
              floatingOffsetClass ?? 'right-5',
              notes.status === 'error'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-border bg-background/95 text-foreground'
            )}
          >
            {notes.status === 'typing' && 'Draft'}
            {notes.status === 'saving' && 'Saving...'}
            {notes.status === 'saved' && 'Saved ✓'}
            {notes.status === 'error' && 'Could not save'}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectionMenu && (
          <motion.button
            id="selection-save-menu"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="fixed z-[80] rounded-full border border-border bg-background/95 px-3 py-1.5 text-xs text-foreground shadow-lg backdrop-blur hover:bg-secondary"
            style={{
              left: selectionMenu.x,
              top: selectionMenu.y,
              transform: 'translate(-50%, -100%)',
            }}
            onClick={saveSelectionToNotes}
          >
            Save to notes
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notesOpen && (
          <motion.div
            ref={notesPanelRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed bottom-24 z-[65] w-[min(92vw,420px)]',
              floatingOffsetClass ?? 'right-5',
              'rounded-2xl border border-border bg-card p-4 shadow-2xl backdrop-blur'
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                Personal Notes
              </p>
              <div className="text-[11px] text-muted-foreground min-h-4">
                {notes.status === 'idle' && 'Auto-save enabled'}
                {notes.status === 'typing' && 'Draft'}
                {notes.status === 'saving' && 'Saving...'}
                {notes.status === 'error' && 'Could not save'}
                <AnimatePresence>
                  {notes.status === 'saved' && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-emerald-600"
                    >
                      Saved ✓
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <textarea
              value={notes.notes}
              onChange={(e) => notes.onChange(e.target.value)}
              placeholder="Write your observations here..."
              className={cn(
                'min-h-36 w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm',
                'text-foreground placeholder:text-muted-foreground/60',
                'focus:outline-none focus:ring-2 focus:ring-primary/30'
              )}
            />
            {notes.saveError && (
              <p className="mt-2 text-xs text-destructive leading-snug">{notes.saveError}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <TechniqueChat technique={technique} hobby={plan.hobby} />
    </article>
  )
})
