import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_STREAK } from '@/constants'
import { storageService } from '@/lib/storage'
import type { AppData } from '@/types'

const STORAGE_KEY = 'knack_v1'

function setData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function getData(): AppData {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as AppData
}

function seedPlanData(): AppData {
  return {
    plans: [
      {
        id: 'plan-1',
        hobby: 'Chess',
        currentLevel: 'beginner',
        targetLevel: 'intermediate',
        createdAt: '2026-01-01T00:00:00.000Z',
        lastActiveAt: '2026-01-01T00:00:00.000Z',
        techniques: [
          {
            id: 'tech-1',
            name: 'Forks',
            hookFact: 'Did you know forks win queens quickly',
            whyItMatters: 'Forcing tactical gains',
            contentType: 'video',
            estimatedHours: 2,
            difficulty: 2,
            keyConcepts: ['Double attack: one move attacks two pieces'],
            resources: { videoQuery: 'chess forks', articleLinks: [] },
            status: 'pending',
            position: 0,
          },
        ],
      },
    ],
    activePlanId: 'plan-1',
    streak: { ...DEFAULT_STREAK },
  }
}

describe('storageService', () => {
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

  it('returns empty app data when storage is blank', () => {
    const data = storageService.getAppData()
    expect(data.plans).toEqual([])
    expect(data.activePlanId).toBeNull()
    expect(data.streak).toEqual(DEFAULT_STREAK)
  })

  it('updates technique status and completion date', () => {
    setData(seedPlanData())
    storageService.updateTechniqueStatus('plan-1', 'tech-1', 'mastered')

    const next = getData()
    const updated = next.plans[0].techniques[0]
    expect(updated.status).toBe('mastered')
    expect(updated.completedAt).toBeTruthy()
  })

  it('updates streak to one when last activity is old', () => {
    const old = seedPlanData()
    old.streak = { count: 5, lastActiveDate: '2000-01-01' }
    setData(old)

    storageService.updateStreak()
    const next = getData()

    expect(next.streak.count).toBe(1)
    expect(next.streak.lastActiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
