'use client'

import { Children, isValidElement, useEffect, useState, memo, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { usePlanStore } from '@/store/planStore'
import { useUIStore } from '@/store/uiStore'
import { MermaidDiagram } from '@/components/technique/MermaidDiagram'
import { cn } from '@/lib/utils'
import type { Technique } from '@/types'

function preWrapsMermaid(children: ReactNode) {
  const first = Children.toArray(children)[0]
  if (!isValidElement(first)) return false
  const props = first.props as { chart?: unknown }
  return typeof props.chart === 'string'
}

interface MarkdownContentProps {
  technique: Technique
}

export const MarkdownContent = memo(function MarkdownContent({ technique }: MarkdownContentProps) {
  const [content, setContent] = useState<string | null>(technique.mdxContent ?? null)
  const [isLoading, setIsLoading] = useState(!technique.mdxContent)
  const [error, setError] = useState(false)

  const updateTechniqueMdx = usePlanStore((s) => s.updateTechniqueMdx)
  const hobby = usePlanStore((s) => s.activePlan?.hobby ?? '')
  const storeMdx = usePlanStore(
    (s) => s.activePlan?.techniques.find((t) => t.id === technique.id)?.mdxContent
  )

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

    const preferences = useUIStore.getState().preferences ?? undefined

    fetch('/api/generate-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        techniqueId: technique.id,
        techniqueName: technique.name,
        hobby,
        whyItMatters: technique.whyItMatters,
        keyConcepts: technique.keyConcepts,
        ...(preferences ? { preferences } : {}),
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
          pre: ({ children }) => {
            if (preWrapsMermaid(children)) {
              return <div className="my-6 w-full">{children}</div>
            }
            return (
              <pre
                className={cn(
                  'my-6 flex w-full justify-center overflow-x-auto rounded-xl border border-border',
                  'bg-muted/40 px-3 py-4 text-[13px] leading-relaxed font-mono text-foreground/90'
                )}
              >
                {children}
              </pre>
            )
          },
          code: ({ className, children, ...props }) => {
            const lang = /language-(\w+)/.exec(className ?? '')?.[1]
            if (lang === 'mermaid') {
              const text = String(children).replace(/\n$/, '')
              return <MermaidDiagram chart={text} />
            }
            const isBlock = typeof className === 'string' && className.includes('language-')
            if (isBlock) {
              return (
                <code
                  className={cn(
                    className,
                    'block w-max max-w-full text-left font-mono text-[13px] leading-relaxed'
                  )}
                  {...props}
                >
                  {children}
                </code>
              )
            }
            return (
              <code
                className="rounded bg-muted px-1.5 py-0.5 text-[0.9em] font-mono text-foreground/90"
                {...props}
              >
                {children}
              </code>
            )
          },
          table: ({ children }) => (
            <div className="my-6 flex w-full justify-center overflow-x-auto">
              <table
                className={cn(
                  'border-separate border-spacing-0 overflow-hidden rounded-lg text-center',
                  'text-[11px] font-mono leading-none md:text-xs',
                  'ring-1 ring-border/50 bg-muted/10'
                )}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/35 text-foreground/90">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="[&_tr:last-child_td]:border-b-0">{children}</tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="border-b border-r border-border/35 px-1 py-1.5 font-medium last:border-r-0 md:px-1.5">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-r border-border/25 px-1 py-1.5 last:border-r-0 md:px-1.5">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
})
