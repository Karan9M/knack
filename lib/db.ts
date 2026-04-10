import { getDb } from '@/lib/supabase'
import type {
  Plan,
  Technique,
  TechniqueStatus,
  YouTubeVideo,
  WikipediaImage,
  PracticeTask,
  SkillLevel,
  StreakData,
} from '@/types'
import { getTodayDateString, isYesterday, isToday } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function getOrCreateSession(sessionId: string): Promise<string> {
  const db = getDb()

  const { data } = await db.from('sessions').select('id').eq('id', sessionId).maybeSingle()

  if (data) return data.id as string

  const { data: created, error } = await db
    .from('sessions')
    .insert({ id: sessionId })
    .select('id')
    .single()

  if (error) throw new Error(`Failed to create session: ${error.message}`)
  return created.id as string
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

interface CreatePlanInput {
  sessionId: string
  hobby: string
  currentLevel: SkillLevel
  targetLevel: SkillLevel
  techniques: Omit<Technique, 'id' | 'position'>[]
}

export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  const db = getDb()

  await getOrCreateSession(input.sessionId)

  const { data: plan, error: planError } = await db
    .from('plans')
    .insert({
      session_id: input.sessionId,
      hobby: input.hobby,
      current_level: input.currentLevel,
      target_level: input.targetLevel,
    })
    .select()
    .single()

  if (planError) throw new Error(`Failed to create plan: ${planError.message}`)

  const techniqueRows = input.techniques.map((t, index) => ({
    plan_id: plan.id as string,
    position: index,
    name: t.name,
    hook_fact: t.hookFact,
    why_it_matters: t.whyItMatters,
    content_type: t.contentType,
    estimated_hours: t.estimatedHours,
    difficulty: t.difficulty,
    key_concepts: t.keyConcepts,
    video_query: t.resources.videoQuery,
    article_links: t.resources.articleLinks ?? [],
    practice_task: t.practiceTask ?? null,
    status: 'pending',
  }))

  const { data: techniques, error: techError } = await db
    .from('techniques')
    .insert(techniqueRows)
    .select()

  if (techError) throw new Error(`Failed to create techniques: ${techError.message}`)

  return rowsToPlan(plan, techniques as TechniqueRow[])
}

export async function getPlanById(planId: string): Promise<Plan | null> {
  const db = getDb()

  const { data: plan, error: planError } = await db
    .from('plans')
    .select('*')
    .eq('id', planId)
    .maybeSingle()

  if (planError) throw new Error(`Failed to fetch plan: ${planError.message}`)
  if (!plan) return null

  const { data: techniques, error: techError } = await db
    .from('techniques')
    .select('*')
    .eq('plan_id', planId)
    .order('position')

  if (techError) throw new Error(`Failed to fetch techniques: ${techError.message}`)

  return rowsToPlan(plan, techniques as TechniqueRow[])
}

export async function getSessionPlans(sessionId: string): Promise<Plan[]> {
  const db = getDb()

  const { data: plans, error } = await db
    .from('plans')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch session plans: ${error.message}`)
  if (!plans?.length) return []

  const planIds = plans.map((p) => p.id as string)

  const { data: techniques, error: techError } = await db
    .from('techniques')
    .select('*')
    .in('plan_id', planIds)
    .order('position')

  if (techError) throw new Error(`Failed to fetch techniques: ${techError.message}`)

  const techByPlan = (techniques as TechniqueRow[]).reduce<Record<string, TechniqueRow[]>>(
    (acc, t) => {
      const pid = t.plan_id
      if (!acc[pid]) acc[pid] = []
      acc[pid].push(t)
      return acc
    },
    {}
  )

  return plans.map((p) => rowsToPlan(p, techByPlan[p.id as string] ?? []))
}

export async function touchPlan(planId: string): Promise<void> {
  const db = getDb()
  await db.from('plans').update({ last_active_at: new Date().toISOString() }).eq('id', planId)
}

// ---------------------------------------------------------------------------
// Techniques
// ---------------------------------------------------------------------------

export async function updateTechniqueStatus(
  techniqueId: string,
  status: TechniqueStatus
): Promise<void> {
  const db = getDb()
  const { error } = await db
    .from('techniques')
    .update({
      status,
      completed_at: status === 'mastered' ? new Date().toISOString() : null,
    })
    .eq('id', techniqueId)

  if (error) throw new Error(`Failed to update status: ${error.message}`)
}

export async function cacheVideoResults(
  techniqueId: string,
  videos: YouTubeVideo[]
): Promise<void> {
  const db = getDb()
  const { error } = await db
    .from('techniques')
    .update({ video_cache: videos })
    .eq('id', techniqueId)

  if (error) throw new Error(`Failed to cache videos: ${error.message}`)
}

export async function saveMdxContent(techniqueId: string, content: string): Promise<void> {
  const db = getDb()
  const { error } = await db
    .from('techniques')
    .update({ mdx_content: content })
    .eq('id', techniqueId)

  if (error) throw new Error(`Failed to save MDX content: ${error.message}`)
}

export async function saveWikipediaImage(
  techniqueId: string,
  image: WikipediaImage
): Promise<void> {
  const db = getDb()
  const { error } = await db
    .from('techniques')
    .update({ wikipedia_image: image })
    .eq('id', techniqueId)

  if (error) throw new Error(`Failed to save Wikipedia image: ${error.message}`)
}

export async function saveGeneratedImage(techniqueId: string, url: string): Promise<void> {
  const db = getDb()
  const { error } = await db
    .from('techniques')
    .update({ generated_image: url })
    .eq('id', techniqueId)

  if (error) throw new Error(`Failed to save generated image: ${error.message}`)
}

// ---------------------------------------------------------------------------
// Streaks
// ---------------------------------------------------------------------------

export async function getStreak(sessionId: string): Promise<StreakData> {
  const db = getDb()
  const { data } = await db.from('streaks').select('*').eq('session_id', sessionId).maybeSingle()

  if (!data) return { count: 0, lastActiveDate: '' }

  return {
    count: data.count as number,
    lastActiveDate: (data.last_active_date as string) ?? '',
  }
}

export async function updateStreak(sessionId: string): Promise<StreakData> {
  const db = getDb()
  const today = getTodayDateString()

  const { data: existing } = await db
    .from('streaks')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (!existing) {
    await db.from('streaks').insert({ session_id: sessionId, count: 1, last_active_date: today })
    return { count: 1, lastActiveDate: today }
  }

  const lastDate = (existing.last_active_date as string) ?? ''

  if (isToday(lastDate)) {
    return { count: existing.count as number, lastActiveDate: lastDate }
  }

  const newCount = isYesterday(lastDate) ? (existing.count as number) + 1 : 1

  await db
    .from('streaks')
    .update({ count: newCount, last_active_date: today })
    .eq('session_id', sessionId)

  return { count: newCount, lastActiveDate: today }
}

// ---------------------------------------------------------------------------
// Row → Domain type converters
// ---------------------------------------------------------------------------

interface PlanRow {
  id: string
  session_id: string
  hobby: string
  current_level: string
  target_level: string
  created_at: string
  last_active_at: string
}

interface TechniqueRow {
  id: string
  plan_id: string
  position: number
  name: string
  hook_fact: string
  why_it_matters: string
  content_type: string
  estimated_hours: number
  difficulty: number
  key_concepts: string[]
  video_query: string
  video_cache: YouTubeVideo[] | null
  article_links: ArticleLinkRow[]
  practice_task: PracticeTask | null
  mdx_content: string | null
  wikipedia_image: WikipediaImage | null
  status: string
  completed_at: string | null
}

interface ArticleLinkRow {
  title: string
  url: string
  source: string
}

function rowsToPlan(plan: PlanRow, techniques: TechniqueRow[]): Plan {
  return {
    id: plan.id,
    hobby: plan.hobby,
    currentLevel: plan.current_level as Plan['currentLevel'],
    targetLevel: plan.target_level as Plan['targetLevel'],
    createdAt: plan.created_at,
    lastActiveAt: plan.last_active_at,
    techniques: techniques.map(rowToTechnique),
  }
}

function rowToTechnique(t: TechniqueRow): Technique {
  return {
    id: t.id,
    position: t.position,
    name: t.name,
    hookFact: t.hook_fact,
    whyItMatters: t.why_it_matters,
    contentType: t.content_type as Technique['contentType'],
    estimatedHours: t.estimated_hours,
    difficulty: t.difficulty as Technique['difficulty'],
    keyConcepts: t.key_concepts,
    resources: {
      videoQuery: t.video_query,
      videoCache: t.video_cache ?? undefined,
      articleLinks: t.article_links ?? [],
    },
    practiceTask: t.practice_task ?? undefined,
    mdxContent: t.mdx_content ?? undefined,
    wikipediaImage: t.wikipedia_image ?? undefined,
    status: t.status as TechniqueStatus,
    completedAt: t.completed_at ?? undefined,
  }
}
