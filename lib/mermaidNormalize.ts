/**
 * Fixes common LLM mistakes in Mermaid source before parse/render.
 */
const LISTISH_FIRST_LINE = /^\s*(mindmap|timeline|quadrantChart)\b/i

/**
 * Models often paste Markdown list markers (+, -, *, 1.) into mindmap / similar diagrams;
 * Mermaid treats those as invalid syntax.
 */
function stripMarkdownListMarkersInListishDiagrams(s: string): string {
  const lines = s.split('\n')
  const firstIdx = lines.findIndex((l) => l.trim().length > 0)
  if (firstIdx < 0) return s
  const head = lines[firstIdx]?.trim() ?? ''
  if (!LISTISH_FIRST_LINE.test(head)) return s

  return lines
    .map((line, i) => {
      if (i <= firstIdx) return line
      return line.replace(/^(\s*)(?:[+*•]\s+|\d+\.\s+|(?:-\s+))(?=\S)/, '$1')
    })
    .join('\n')
}

export function normalizeMermaidSource(src: string): string {
  let s = src.replace(/\r\n/g, '\n')

  // Invalid: -->|label|> Node  (extra `>` after edge label)
  s = s.replace(/-->\|([^|\n]+)\|>\s*/g, '-->|$1| ')

  // Same for ---|label|>
  s = s.replace(/---\|([^|\n]+)\|>\s*/g, '---|$1| ')

  s = stripMarkdownListMarkersInListishDiagrams(s)

  return s
}
