import { type NextRequest } from 'next/server'
import { GeneratePlanSchema } from '@/lib/validators'
import { generatePlanTechniques } from '@/lib/ai'
import { createPlan } from '@/lib/db'
import type { GeneratePlanResponse } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const parsed = GeneratePlanSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { hobby, currentLevel, targetLevel, sessionId } = parsed.data

    const rawTechniques = await generatePlanTechniques(hobby, currentLevel, targetLevel)

    const plan = await createPlan({
      sessionId,
      hobby,
      currentLevel,
      targetLevel,
      techniques: rawTechniques.map((t, index) => ({
        name: t.name,
        hookFact: t.hookFact,
        whyItMatters: t.whyItMatters,
        contentType: t.contentType,
        estimatedHours: t.estimatedHours,
        difficulty: t.difficulty,
        keyConcepts: t.keyConcepts,
        resources: {
          videoQuery: t.resources.videoQuery,
          articleLinks: t.resources.articleLinks ?? [],
        },
        status: 'pending',
        position: index,
      })),
    })

    const response: GeneratePlanResponse = {
      planId: plan.id,
      techniques: plan.techniques,
    }

    return Response.json(response, { status: 200 })
  } catch (error) {
    console.error('[generate-plan]', error)
    const message = error instanceof Error ? error.message : 'Failed to generate plan'
    return Response.json({ error: message }, { status: 500 })
  }
}
