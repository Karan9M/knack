import { cn } from '@/lib/utils'

interface KeyConceptsListProps {
  concepts: string[]
  className?: string
}

/**
 * Splits a concept string on the first ": " into a [term, explanation] pair.
 * Falls back to [concept, undefined] for old single-word entries.
 */
function parseConcept(raw: string): { term: string; explanation: string | undefined } {
  const idx = raw.indexOf(': ')
  if (idx === -1) return { term: raw, explanation: undefined }
  return { term: raw.slice(0, idx), explanation: raw.slice(idx + 2) }
}

export function KeyConceptsList({ concepts, className }: KeyConceptsListProps) {
  if (concepts.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <h3 className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
        Key Concepts
      </h3>
      <ul className="flex flex-col divide-y divide-border">
        {concepts.map((concept, i) => {
          const { term, explanation } = parseConcept(concept)
          return (
            <li key={i} className="flex items-start gap-3.5 py-3 first:pt-0 last:pb-0">
              <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-primary shrink-0" aria-hidden />
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold text-foreground leading-snug">{term}</span>
                {explanation && (
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    {explanation}
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
