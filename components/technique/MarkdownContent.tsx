'use client'

import { useEffect, useState, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { usePlanStore } from '@/store/planStore'
import type { Technique } from '@/types'

interface MarkdownContentProps {
  technique: Technique
}

// Wrapped in memo so it only re-renders when technique.id changes, not on every store update
export const MarkdownContent = memo(function MarkdownContent({ technique }: MarkdownContentProps) {
  const [content, setContent] = useState<string | null>(technique.mdxContent ?? null)
  const [isLoading, setIsLoading] = useState(!technique.mdxContent)
  const [error, setError] = useState(false)

  // Narrow selectors — only subscribe to what this component actually uses
  const updateTechniqueMdx = usePlanStore((s) => s.updateTechniqueMdx)
  const hobby = usePlanStore((s) => s.activePlan?.hobby ?? '')
  // Watch only this technique's mdxContent in the store; ignores all other changes
  const storeMdx = usePlanStore(
    (s) => s.activePlan?.techniques.find((t) => t.id === technique.id)?.mdxContent
  )

  // Sync from store when content arrives (e.g. navigating back to a cached technique)
  useEffect(() => {
    if (storeMdx && !content) {
      setContent(storeMdx)
      setIsLoading(false)
    }
  }, [storeMdx, content])

  useEffect(() => {
    if (technique.mdxContent || storeMdx || content) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(false)

    fetch('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        techniqueId: technique.id,
        techniqueName: technique.name,
        hobby,
        whyItMatters: technique.whyItMatters,
        keyConcepts: technique.keyConcepts,
      }),
    })
      .then((r) => r.json())
      .then((data: { content?: string; error?: string }) => {
        if (data.content) {
          setContent(data.content)
          updateTechniqueMdx(technique.id, data.content)
        } else {
          setError(true)
        }
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technique.id])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-2">
        {[85, 92, 70, 88, 60, 78, 50].map((w, i) => (
          <div
            key={i}
            className="h-4 bg-secondary rounded-md animate-pulse"
            style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    )
  }

  if (error || !content) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Unable to load guide content. The key concepts above cover the essentials.
      </p>
    )
  }

  return (
    <div className="text-base leading-[1.8] text-foreground/90">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-foreground mt-10 mb-3 first:mt-0 leading-snug">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-semibold text-base text-foreground mt-7 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-base text-foreground/85 leading-[1.8] mb-5">{children}</p>
          ),
          ul: ({ children }) => <ul className="flex flex-col gap-2 mb-5 pl-0">{children}</ul>,
          li: ({ children }) => (
            <li className="flex items-start gap-3 text-base text-foreground/85 leading-relaxed">
              <span className="mt-2.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-foreground/70">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
