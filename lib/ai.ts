import type { SkillLevel } from '@/types'
import { GeminiPlanResponseSchema, type GeminiTechnique } from '@/lib/validators'
import { GroqClientService } from '@/lib/services/groq-client.service'

export const buildPlanPrompt = (hobby: string, current: SkillLevel, target: SkillLevel): string => `
You are a master coach for ${hobby}.

Generate a focused learning roadmap for someone at ${current} level wanting to reach ${target} level.

RULES:
- Return exactly 5 to 8 techniques. No more, no less.
- Only include techniques truly essential for this level progression.
- contentType: choose "video" for physical/motor skills (guitar, chess, sport), "article" for strategy/theory heavy topics (poker, investing), "both" for mixed.
- hookFact: a surprising one-liner that creates curiosity about this technique. Start with "Did you know" or similar.
- videoQuery: a precise YouTube search string that will find the best tutorial for this exact technique and hobby.
- estimatedHours: realistic solo practice hours to reach basic competency.
- keyConcepts: exactly 3–4 items. Each item MUST follow this exact format: "term: one-line explanation of why it matters". Example: "Bat angle: keeping the face closed at impact stops the ball rising off the face". Never return a bare word — always include the colon and the explanation.
- practiceTask: a concrete, time-boxed exercise the learner can do TODAY — no theory, just action.
  - drill: the exact physical or mental action to perform. Be specific: name reps, positions, speeds, targets.
  - duration: a time or rep target, e.g. "15 min", "50 reps", "3 sets × 10".
  - cue: one sensory or measurable signal that tells them it's working, e.g. "you'll feel your wrist snap at contact" or "the ball lands in the same spot 8/10 tries".

Return ONLY valid JSON. No markdown fences, no explanation, no preamble.

{
  "techniques": [
    {
      "id": "technique_1",
      "name": "string",
      "hookFact": "string",
      "whyItMatters": "string — one sentence",
      "contentType": "video" | "article" | "both",
      "estimatedHours": number,
      "difficulty": 1-5,
      "keyConcepts": ["string", "string", "string"],
      "resources": {
        "videoQuery": "string",
        "articleLinks": []
      },
      "practiceTask": {
        "drill": "string — exact action, no theory",
        "duration": "string — e.g. 20 min or 50 reps",
        "cue": "string — the success signal"
      },
      "status": "pending"
    }
  ]
}
`

export async function generatePlanTechniques(
  hobby: string,
  currentLevel: SkillLevel,
  targetLevel: SkillLevel
): Promise<GeminiTechnique[]> {
  const { sdk: client } = GroqClientService.fromEnv()

  const prompt = buildPlanPrompt(hobby, currentLevel, targetLevel)

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })

  const text = (response.choices[0]?.message?.content ?? '').trim()

  // Strip any accidental markdown fences
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Groq returned non-JSON response: ${cleaned.slice(0, 200)}`)
  }

  const validated = GeminiPlanResponseSchema.safeParse(parsed)
  if (!validated.success) {
    throw new Error(`Response failed validation: ${validated.error.message}`)
  }

  return validated.data.techniques
}
