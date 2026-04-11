/**
 * Fixes common LLM mistakes in Mermaid source before parse/render.
 */
export function normalizeMermaidSource(src: string): string {
  let s = src.replace(/\r\n/g, '\n')

  // Invalid: -->|label|> Node  (extra `>` after edge label)
  s = s.replace(/-->\|([^|\n]+)\|>\s*/g, '-->|$1| ')

  // Same for ---|label|>
  s = s.replace(/---\|([^|\n]+)\|>\s*/g, '---|$1| ')

  return s
}
