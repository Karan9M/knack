import { describe, expect, it } from 'vitest'
import { sanitizeGeneratedMdx } from './mdxSanitize'

describe('sanitizeGeneratedMdx', () => {
  it('keeps normal paragraphs and markdown tables', () => {
    const m = `## Hi\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\nHello world.`
    expect(sanitizeGeneratedMdx(m)).toBe(m)
  })

  it('removes long junk ASCII lines with many pipes', () => {
    const junk = '|||||||||---|---|---|---|---|---|---|---|---|||||P||||||||P||||||||||||'
    const m = `## Visual\n\n\`\`\`mermaid\nflowchart TD\nA-->B\n\`\`\`\n\n${junk}\n\nRest.`
    const out = sanitizeGeneratedMdx(m)
    expect(out).not.toContain(junk)
    expect(out).toContain('Rest.')
  })
})
