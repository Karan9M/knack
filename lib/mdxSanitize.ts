/**
 * Removes stray ASCII "diagram" lines models sometimes emit after Mermaid blocks
 * (e.g. long runs of | - + that are not valid markdown tables).
 */
export function sanitizeGeneratedMdx(mdx: string): string {
  return mdx
    .split('\n')
    .filter((line) => !isJunkAsciiDiagramLine(line))
    .join('\n')
}

function isJunkAsciiDiagramLine(line: string): boolean {
  const t = line.trim()
  if (t.length < 20) return false

  const pipes = (t.match(/\|/g) ?? []).length
  if (pipes < 12) return false

  // Markdown table separator row
  if (/^\|?[\s\-:|]+\|?\s*$/.test(t) && !/[a-zA-Z]{2,}/.test(t)) return false

  const cells = t
    .split('|')
    .map((s) => s.trim())
    .filter((c) => c.length > 0)
  const textCells = cells.filter((c) => !/^[-:]+$/.test(c))

  // Normal wide table rows (e.g. chess rank with many single-char cells)
  if (textCells.length >= 3 && textCells.every((c) => c.length <= 6)) return false

  // Few real cells but extreme pipe density → broken ASCII art
  if (textCells.length <= 2 && pipes >= 12) return true

  if (/^[|+.\-\\/\s]{20,}$/.test(t)) return true

  return false
}
