export type TechniqueStatus = 'pending' | 'mastered' | 'skipped'
export type ContentType = 'video' | 'article' | 'both'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'

/** A concrete, time-boxed exercise the user can do right now. */
export interface PracticeTask {
  /** The exact physical/mental action to perform — no theory, just do. */
  drill: string
  /** Time or rep target, e.g. "20 min", "50 reps", "3 sets × 10". */
  duration: string
  /** The success signal — "you'll know it's working when…" */
  cue: string
}

export type ImageStyle = 'illustrations' | 'cartoons' | 'ghibli' | 'diagrams' | 'flowcharts'
export type LearningMode = 'videos' | 'reading' | 'hands-on' | 'mixed'
export type SessionLength = 'quick' | 'regular' | 'deep'

export interface UserPreferences {
  imageStyle: ImageStyle
  learningMode: LearningMode
  sessionLength: SessionLength
}

export interface YouTubeVideo {
  id: string
  title: string
  thumbnail: string
  channelName: string
  duration?: string
}

export interface ArticleLink {
  title: string
  url: string
  source: string
}

export interface WikipediaImage {
  url: string
  caption: string
  pageTitle: string
}

export interface TechniqueResources {
  videoQuery: string
  videoCache?: YouTubeVideo[]
  articleLinks?: ArticleLink[]
}

export interface Technique {
  id: string
  name: string
  hookFact: string
  whyItMatters: string
  contentType: ContentType
  estimatedHours: number
  difficulty: 1 | 2 | 3 | 4 | 5
  keyConcepts: string[]
  resources: TechniqueResources
  status: TechniqueStatus
  completedAt?: string
  practiceTask?: PracticeTask
  mdxContent?: string
  wikipediaImage?: WikipediaImage
  generatedImage?: string
  notes?: string
  position: number
}

export interface Plan {
  id: string
  hobby: string
  currentLevel: SkillLevel
  targetLevel: SkillLevel
  techniques: Technique[]
  createdAt: string
  lastActiveAt: string
}

export interface StreakData {
  count: number
  lastActiveDate: string
}

export interface AppData {
  plans: Plan[]
  activePlanId: string | null
  streak: StreakData
}

// API response shapes
export interface GeneratePlanResponse {
  planId: string
  techniques: Technique[]
}

export interface PlanResponse {
  plan: Plan
}
