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
        mermaid.setParseErrorHandler(() => {
          /* no-op: avoid default error UI leaking into the page */
        })
        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'strict',
          suppressErrorRendering: true,
          logLevel: 'error',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
          flowchart: {
            htmlLabels: false,
            curve: 'basis',
          },
        })
        const id = `mmd-${uid}-${Date.now()}`
        const { svg } = await mermaid.render(id, source)
        if (cancelled || !ref.current) return
        if (/syntax error in text|parse error|mermaid version/i.test(svg)) {
          throw new Error('Mermaid rendered an error SVG')
        }
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
          'my-6 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground'
        )}
        role="status"
      >
        <p className="font-medium text-foreground">This diagram couldn&apos;t be displayed.</p>
        <p className="mt-1.5 text-xs leading-relaxed">
          The lesson may use diagram formatting we couldn&apos;t parse. You can still follow the
          text above—nothing is wrong with your device.
        </p>
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
