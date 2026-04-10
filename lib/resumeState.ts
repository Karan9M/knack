export interface ResumeState {
  planId: string
  techniqueId: string
  techniqueName: string
  timestamp: number
}

export const RESUME_STATE_KEY = 'knack_resume_state_v1' as const

export function readResumeState(): ResumeState | null {
  try {
    const raw = localStorage.getItem(RESUME_STATE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null

    const data = parsed as Partial<ResumeState>
    if (
      typeof data.planId !== 'string' ||
      typeof data.techniqueId !== 'string' ||
      typeof data.techniqueName !== 'string' ||
      typeof data.timestamp !== 'number'
    ) {
      return null
    }

    return {
      planId: data.planId,
      techniqueId: data.techniqueId,
      techniqueName: data.techniqueName,
      timestamp: data.timestamp,
    }
  } catch {
    return null
  }
}

export function writeResumeState(value: Omit<ResumeState, 'timestamp'>): void {
  try {
    const payload: ResumeState = { ...value, timestamp: Date.now() }
    localStorage.setItem(RESUME_STATE_KEY, JSON.stringify(payload))
  } catch {}
}
