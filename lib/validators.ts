import { z } from 'zod'

export const SkillLevelSchema = z.enum(['beginner', 'intermediate', 'advanced'])

export const GeneratePlanSchema = z.object({
  hobby: z.string().min(1, 'Hobby is required').max(100, 'Hobby name is too long'),
  currentLevel: SkillLevelSchema,
  targetLevel: SkillLevelSchema,
  sessionId: z.string().uuid('Invalid session ID'),
})

export const FetchVideosSchema = z.object({
  query: z.string().min(1, 'Query is required').max(200, 'Query is too long'),
})

export const GenerateContentSchema = z.object({
  techniqueId: z.string().uuid(),
  techniqueName: z.string(),
  hobby: z.string(),
  whyItMatters: z.string(),
  keyConcepts: z.array(z.string()),
})

export const UpdateTechniqueStatusSchema = z.object({
  status: z.enum(['pending', 'mastered', 'skipped']),
})

export const ArticleLinkSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  source: z.string(),
})

export const PracticeTaskSchema = z.object({
  drill: z.string(),
  duration: z.string(),
  cue: z.string(),
})

export const GeminiTechniqueSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  hookFact: z.string(),
  whyItMatters: z.string(),
  contentType: z.enum(['video', 'article', 'both']),
  estimatedHours: z.number().positive(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  keyConcepts: z.array(z.string()),
  resources: z.object({
    videoQuery: z.string(),
    articleLinks: z.array(ArticleLinkSchema).optional().default([]).catch([]),
  }),
  // Graceful fallback — if Groq omits the field the app still works
  practiceTask: PracticeTaskSchema.optional().catch(undefined),
})

export const GeminiPlanResponseSchema = z.object({
  techniques: z.array(GeminiTechniqueSchema).min(5).max(8),
})

export type GeneratePlanInput = z.infer<typeof GeneratePlanSchema>
export type FetchVideosInput = z.infer<typeof FetchVideosSchema>
export type GenerateContentInput = z.infer<typeof GenerateContentSchema>
export type GeminiTechnique = z.infer<typeof GeminiTechniqueSchema>
