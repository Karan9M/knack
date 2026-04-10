import type { AppData, Plan, TechniqueStatus, YouTubeVideo, StreakData } from '@/types'
import { STORAGE_KEY, DEFAULT_STREAK } from '@/constants'
import { getTodayDateString, isYesterday, isToday } from '@/lib/utils'

const EMPTY_APP_DATA: AppData = {
  plans: [],
  activePlanId: null,
  streak: { ...DEFAULT_STREAK },
}

class StorageService {
  private readonly key: string

  constructor(key: string) {
    this.key = key
  }

  private read(): AppData {
    try {
      const raw = localStorage.getItem(this.key)
      if (!raw) return { ...EMPTY_APP_DATA, streak: { ...DEFAULT_STREAK } }
      return JSON.parse(raw) as AppData
    } catch {
      return { ...EMPTY_APP_DATA, streak: { ...DEFAULT_STREAK } }
    }
  }

  private write(data: AppData): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(data))
    } catch {
      // localStorage may be unavailable in private browsing
    }
  }

  getAppData(): AppData {
    return this.read()
  }

  saveAppData(data: AppData): void {
    this.write(data)
  }

  savePlan(plan: Plan): void {
    const data = this.read()
    const updated: AppData = {
      ...data,
      plans: [...data.plans.filter((p) => p.id !== plan.id), plan],
    }
    this.write(updated)
  }

  getActivePlan(): Plan | null {
    const data = this.read()
    if (!data.activePlanId) return null
    return data.plans.find((p) => p.id === data.activePlanId) ?? null
  }

  setActivePlan(planId: string): void {
    const data = this.read()
    this.write({ ...data, activePlanId: planId })
  }

  updateTechniqueStatus(planId: string, techniqueId: string, status: TechniqueStatus): void {
    const data = this.read()
    const updated: AppData = {
      ...data,
      plans: data.plans.map((plan) => {
        if (plan.id !== planId) return plan
        return {
          ...plan,
          lastActiveAt: new Date().toISOString(),
          techniques: plan.techniques.map((t) => {
            if (t.id !== techniqueId) return t
            return {
              ...t,
              status,
              completedAt: status === 'mastered' ? new Date().toISOString() : t.completedAt,
            }
          }),
        }
      }),
    }
    this.write(updated)
  }

  cacheVideoResults(planId: string, techniqueId: string, videos: YouTubeVideo[]): void {
    const data = this.read()
    const updated: AppData = {
      ...data,
      plans: data.plans.map((plan) => {
        if (plan.id !== planId) return plan
        return {
          ...plan,
          techniques: plan.techniques.map((t) => {
            if (t.id !== techniqueId) return t
            return { ...t, resources: { ...t.resources, videoCache: videos } }
          }),
        }
      }),
    }
    this.write(updated)
  }

  updateStreak(): void {
    const data = this.read()
    const today = getTodayDateString()
    const { lastActiveDate, count } = data.streak

    if (isToday(lastActiveDate)) {
      return
    }

    const newCount = isYesterday(lastActiveDate) ? count + 1 : 1
    this.write({
      ...data,
      streak: { count: newCount, lastActiveDate: today },
    })
  }

  getStreak(): StreakData {
    return this.read().streak
  }
}

export const storageService = new StorageService(STORAGE_KEY)

export const getAppData = (): AppData => storageService.getAppData()
export const saveAppData = (data: AppData): void => storageService.saveAppData(data)
export const savePlan = (plan: Plan): void => storageService.savePlan(plan)
export const getActivePlan = (): Plan | null => storageService.getActivePlan()
export const setActivePlan = (planId: string): void => storageService.setActivePlan(planId)
export const updateTechniqueStatus = (
  planId: string,
  techniqueId: string,
  status: TechniqueStatus
): void => storageService.updateTechniqueStatus(planId, techniqueId, status)
export const cacheVideoResults = (
  planId: string,
  techniqueId: string,
  videos: YouTubeVideo[]
): void => storageService.cacheVideoResults(planId, techniqueId, videos)
export const updateStreak = (): void => storageService.updateStreak()
export const getStreak = (): StreakData => storageService.getStreak()
