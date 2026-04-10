import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readResumeState, RESUME_STATE_KEY, writeResumeState } from '@/lib/resumeState'

describe('resumeState', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v)
      },
      removeItem: (k: string) => {
        store.delete(k)
      },
      clear: () => store.clear(),
    })
    localStorage.clear()
  })

  it('returns null when storage is empty', () => {
    expect(readResumeState()).toBeNull()
  })

  it('writes resume state with timestamp', () => {
    writeResumeState({
      planId: 'plan-1',
      techniqueId: 'tech-1',
      techniqueName: 'Jab Cross',
    })

    const raw = localStorage.getItem(RESUME_STATE_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw as string) as { timestamp?: unknown }
    expect(typeof parsed.timestamp).toBe('number')
  })

  it('reads valid resume state', () => {
    localStorage.setItem(
      RESUME_STATE_KEY,
      JSON.stringify({
        planId: 'plan-1',
        techniqueId: 'tech-1',
        techniqueName: 'Jab Cross',
        timestamp: 123,
      })
    )

    expect(readResumeState()).toEqual({
      planId: 'plan-1',
      techniqueId: 'tech-1',
      techniqueName: 'Jab Cross',
      timestamp: 123,
    })
  })

  it('returns null for malformed payloads', () => {
    localStorage.setItem(RESUME_STATE_KEY, JSON.stringify({ bad: true }))
    expect(readResumeState()).toBeNull()
  })
})
