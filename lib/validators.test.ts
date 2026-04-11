import { describe, expect, it } from 'vitest'
import {
  FetchVideosSchema,
  GeminiPlanResponseSchema,
  GeneratePlanSchema,
  TechniqueChatSchema,
  UpdateTechniqueStatusSchema,
} from '@/lib/validators'

describe('GeneratePlanSchema', () => {
  const valid = {
    hobby: 'Chess',
    currentLevel: 'beginner' as const,
    targetLevel: 'intermediate' as const,
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
  }

  it('accepts a valid payload', () => {
    expect(GeneratePlanSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty hobby', () => {
    const r = GeneratePlanSchema.safeParse({ ...valid, hobby: '' })
    expect(r.success).toBe(false)
  })

  it('rejects non-UUID sessionId', () => {
    const r = GeneratePlanSchema.safeParse({ ...valid, sessionId: 'not-a-uuid' })
    expect(r.success).toBe(false)
  })

  it('rejects target at or below current (e.g. beginner target while intermediate)', () => {
    const r = GeneratePlanSchema.safeParse({
      ...valid,
      currentLevel: 'intermediate' as const,
      targetLevel: 'beginner' as const,
    })
    expect(r.success).toBe(false)
  })

  it('rejects same level when not the advanced continued-learning case', () => {
    const r = GeneratePlanSchema.safeParse({
      ...valid,
      currentLevel: 'intermediate' as const,
      targetLevel: 'intermediate' as const,
    })
    expect(r.success).toBe(false)
  })

  it('accepts advanced + advanced for continued learning roadmap', () => {
    const r = GeneratePlanSchema.safeParse({
      ...valid,
      currentLevel: 'advanced' as const,
      targetLevel: 'advanced' as const,
    })
    expect(r.success).toBe(true)
  })
})

describe('FetchVideosSchema', () => {
  it('rejects empty query', () => {
    expect(FetchVideosSchema.safeParse({ query: '' }).success).toBe(false)
  })

  it('accepts a non-empty query', () => {
    expect(FetchVideosSchema.safeParse({ query: 'guitar barre chords' }).success).toBe(true)
  })
})

describe('UpdateTechniqueStatusSchema', () => {
  it('rejects invalid status', () => {
    expect(UpdateTechniqueStatusSchema.safeParse({ status: 'done' }).success).toBe(false)
  })

  it('accepts mastered', () => {
    expect(UpdateTechniqueStatusSchema.safeParse({ status: 'mastered' }).success).toBe(true)
  })
})

describe('GeminiPlanResponseSchema', () => {
  const baseTechnique = {
    name: 'T',
    hookFact: 'h',
    whyItMatters: 'w',
    contentType: 'video' as const,
    estimatedHours: 1,
    difficulty: 1 as const,
    keyConcepts: ['a: b'],
    resources: { videoQuery: 'q', articleLinks: [] },
  }

  it('requires between 5 and 8 techniques', () => {
    const tooFew = {
      techniques: Array.from({ length: 4 }, (_, i) => ({ ...baseTechnique, id: `t${i}` })),
    }
    expect(GeminiPlanResponseSchema.safeParse(tooFew).success).toBe(false)

    const tooMany = {
      techniques: Array.from({ length: 9 }, (_, i) => ({ ...baseTechnique, id: `t${i}` })),
    }
    expect(GeminiPlanResponseSchema.safeParse(tooMany).success).toBe(false)

    const ok = {
      techniques: Array.from({ length: 5 }, (_, i) => ({ ...baseTechnique, id: `t${i}` })),
    }
    expect(GeminiPlanResponseSchema.safeParse(ok).success).toBe(true)
  })
})

describe('TechniqueChatSchema', () => {
  const valid = {
    question: 'How do I keep balance while pivoting?',
    hobby: 'Boxing',
    techniqueName: 'Stance and Footwork',
    whyItMatters: 'Footwork sets up every punch and defense.',
    keyConcepts: ['Balance: stay centered over your base'],
    mdxContent: 'Keep your knees soft and weight distributed.',
    notes: 'I lean too far forward when I jab.',
    history: [{ role: 'user' as const, content: 'What is the first drill?' }],
  }

  it('accepts a valid payload', () => {
    expect(TechniqueChatSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty question', () => {
    expect(TechniqueChatSchema.safeParse({ ...valid, question: '' }).success).toBe(false)
  })
})
