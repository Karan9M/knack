import type { SkillLevel } from '@/types'

export const STORAGE_KEY = 'knack_v1' as const

export const MAX_TECHNIQUES = 8 as const
export const MIN_TECHNIQUES = 5 as const

export const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced']

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export const CONTENT_TYPE_LABELS = {
  video: '📹 Watch',
  article: '📖 Read',
  both: '🎯 Both',
} as const

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Easy',
  2: 'Moderate',
  3: 'Challenging',
  4: 'Hard',
  5: 'Expert',
}

export const APP_NAME = 'Knack' as const

export const GENERATE_PLAN_ENDPOINT = '/api/generate-plan' as const
export const FETCH_VIDEOS_ENDPOINT = '/api/fetch-videos' as const
export const GROQ_MODEL = 'llama-3.3-70b-versatile' as const

export const YOUTUBE_MAX_RESULTS = 3 as const

export const DEFAULT_STREAK: { count: number; lastActiveDate: string } = {
  count: 0,
  lastActiveDate: '',
}
