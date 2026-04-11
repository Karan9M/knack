import { describe, expect, it } from 'vitest'
import { normalizeMermaidSource } from './mermaidNormalize'

describe('normalizeMermaidSource', () => {
  it('fixes invalid labeled edge with extra > after pipe', () => {
    const raw = `flowchart TD
  A[Develop Knight] -->|yes|> B[Control Center]
  A -->|no|> C[Develop Bishop]
`
    const out = normalizeMermaidSource(raw)
    expect(out).toContain('-->|yes| B')
    expect(out).toContain('-->|no| C')
    expect(out).not.toMatch(/\|>\s*B/)
  })

  it('leaves valid labeled edges unchanged', () => {
    const raw = 'A -->|yes| B\nA -->|no| C'
    expect(normalizeMermaidSource(raw)).toBe(raw)
  })

  it('strips markdown list markers from mindmap lines', () => {
    const raw = `mindmap
  Center Control
    + Pawns in center
    + Key squares
  Pawn Structure
    - Pawn chain
    * Pawn island
`
    const out = normalizeMermaidSource(raw)
    expect(out).toContain('Pawns in center')
    expect(out).not.toContain('+ Pawns')
    expect(out).not.toContain('- Pawn chain')
    expect(out).not.toContain('* Pawn island')
  })

  it('strips numbered list markers in mindmap', () => {
    const raw = `mindmap
  Root
    1. First
    2. Second
`
    const out = normalizeMermaidSource(raw)
    expect(out).toMatch(/^\s*First\s*$/m)
    expect(out).toMatch(/^\s*Second\s*$/m)
  })

  it('does not strip hyphens from flowchart edges', () => {
    const raw = 'flowchart TD\n  A --> B'
    expect(normalizeMermaidSource(raw)).toBe(raw)
  })
})
