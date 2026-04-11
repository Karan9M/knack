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
})
