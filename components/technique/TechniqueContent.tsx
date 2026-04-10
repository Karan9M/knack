'use client'

import { memo } from 'react'
import dynamic from 'next/dynamic'
import { ExternalLink, Clock, ArrowRight, Zap, Timer, CheckCircle2 } from 'lucide-react'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { KeyConceptsList } from '@/components/technique/KeyConceptsList'
import { MarkdownContent } from '@/components/technique/MarkdownContent'
import { useTechniqueActions } from '@/hooks/useTechniqueActions'
import { usePlanStore } from '@/store/planStore'
import { useUIStore } from '@/store/uiStore'
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

// ── PracticeTaskCard ──────────────────────────────────────────────────────────

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

// ── TechniqueContent ──────────────────────────────────────────────────────────

interface TechniqueContentProps {
  technique: Technique
  plan: Plan
  onClose?: () => void
}

export const TechniqueContent = memo(function TechniqueContent({
  technique,
  plan,
  onClose,
}: TechniqueContentProps) {
  const { markMastered, skipTechnique } = useTechniqueActions()

  // Only read id+name of the next technique — avoids re-rendering when unrelated
  // fields (videoCache, wikipediaImage, mdxContent) change on other techniques.
  const nextTechnique = usePlanStore(
    useShallow((s) => {
      const techs = s.activePlan?.techniques ?? plan.techniques
      const idx = techs.findIndex((t) => t.id === technique.id)
      const next = idx >= 0 ? techs[idx + 1] : undefined
      return next ? { id: next.id, name: next.name } : null
    })
  )

  // Narrow action-only selector — action references are stable, never causes re-renders
  const setSelectedTechniqueId = useUIStore((s) => s.setSelectedTechniqueId)

  const isMastered = technique.status === 'mastered'
  const isSkipped = technique.status === 'skipped'
  const showVideo = technique.contentType === 'video' || technique.contentType === 'both'
  const showArticles =
    (technique.contentType === 'article' || technique.contentType === 'both') &&
    (technique.resources.articleLinks?.length ?? 0) > 0

  return (
    <article className="max-w-2xl mx-auto px-6 md:px-10 py-10 pb-16">
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

      {/* ── Footer: action + navigation ── */}
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
        ) : nextTechnique ? (
          <button
            onClick={() => {
              setSelectedTechniqueId(nextTechnique.id)
              onClose?.()
            }}
            className={cn(
              'w-full h-12 rounded-2xl flex items-center justify-center gap-2',
              'border border-border bg-card hover:bg-secondary/50 font-medium text-sm',
              'transition-all duration-150'
            )}
          >
            Next: {nextTechnique.name}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <div className="text-center py-3">
            <p className="text-sm font-medium text-emerald-700">
              🎉 You&apos;ve mastered all techniques in this roadmap!
            </p>
          </div>
        )}

        {/* Next technique navigation (when not mastered yet) */}
        {!isMastered && nextTechnique && (
          <button
            onClick={() => {
              setSelectedTechniqueId(nextTechnique.id)
              onClose?.()
            }}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors group"
          >
            <span className="text-xs uppercase tracking-widest font-medium">Next</span>
            <span className="font-medium text-foreground/80 group-hover:text-foreground transition-colors">
              {nextTechnique.name}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
        )}
      </div>
    </article>
  )
})
