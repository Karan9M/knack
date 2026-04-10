import { describe, expect, it } from 'vitest'
import { cn, formatDate } from '@/lib/utils'

describe('cn', () => {
  it('merges tailwind classes and drops conflicts', () => {
    expect(cn('px-2', 'px-4')).toContain('px-4')
    expect(cn('px-2', false && 'hidden', 'block')).toContain('block')
  })
})

describe('formatDate', () => {
  it('formats ISO strings', () => {
    const s = formatDate('2024-06-15T12:00:00.000Z')
    expect(s).toMatch(/Jun/)
    expect(s).toMatch(/2024/)
  })

  it('returns original string on invalid input', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})
