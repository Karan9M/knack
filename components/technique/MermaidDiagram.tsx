'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { normalizeMermaidSource } from '@/lib/mermaidNormalize'

interface MermaidDiagramProps {
  chart: string
}

/**
 * Renders a ```mermaid fenced block as real SVG (not raw ASCII).
 */
export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, 'x')
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const source = normalizeMermaidSource(chart.trim())
    if (!source) {
      setError(true)
      return
    }

    let cancelled = false
    el.replaceChildren()
    setError(false)

    void (async () => {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'strict',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          flowchart: {
            htmlLabels: false,
            curve: 'basis',
          },
        })
        const id = `mmd-${uid}-${Date.now()}`
        const { svg } = await mermaid.render(id, source)
        if (cancelled || !ref.current) return
        ref.current.innerHTML = svg
      } catch {
        if (!cancelled) {
          setError(true)
          if (ref.current) ref.current.replaceChildren()
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [chart, uid, resolvedTheme])

  if (error) {
    return (
      <div
        className={cn(
          'my-6 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground'
        )}
      >
        <p className="mb-2 font-medium text-foreground">Could not render this diagram.</p>
        <pre className="max-h-48 overflow-auto text-xs font-mono whitespace-pre-wrap text-foreground/80">
          {chart}
        </pre>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      role="img"
      aria-label="Diagram"
      className={cn(
        'flex min-h-[100px] w-full max-w-full justify-center overflow-x-auto rounded-xl',
        'border border-border bg-muted/10 px-2 py-4',
        '[&_svg]:h-auto [&_svg]:max-h-[min(480px,70vh)] [&_svg]:w-auto [&_svg]:max-w-full'
      )}
    />
  )
}
