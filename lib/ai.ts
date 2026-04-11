import Groq from 'groq-sdk'
import type { SkillLevel, UserPreferences } from '@/types'
import { GeminiPlanResponseSchema, type GeminiTechnique } from '@/lib/validators'
import { GROQ_MODEL } from '@/constants'

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured')
  return new Groq({ apiKey })
}

function buildPreferenceInstructions(prefs: UserPreferences): string {
  const { imageStyle, learningMode, sessionLength } = prefs

  const hours =
    sessionLength === 'quick'
      ? '- estimatedHours: Use roughly 0.25–1.5 hours per technique (short daily practice). Do NOT use large totals like 8–15h per technique; cap each entry at 2 unless absolutely unavoidable, and prefer fractions like 0.5 or 0.75.'
      : sessionLength === 'deep'
        ? '- estimatedHours: These learners take long sessions — 4–12 hours per hard technique is acceptable when realistic.'
        : '- estimatedHours: Typical hobby competency range, about 1–5 hours per technique unless the skill is unusually deep.'

  const mode =
    learningMode === 'videos'
      ? '- Learning mode WATCH-FIRST: Strongly prefer contentType "video" or "both" for most techniques. Every videoQuery must be a tight YouTube search string for this exact technique + hobby. Keep "article"-only techniques rare (theory-heavy topics only).'
      : learningMode === 'reading'
        ? '- Learning mode READ-FIRST: Prefer contentType "article" or "both" for most techniques. Written explanations matter more than binge-watching. videoQuery is still required but secondary.'
        : learningMode === 'hands-on'
          ? '- Learning mode HANDS-ON: Prefer "both" or "video" with extremely concrete practiceTask blocks; passive watching alone is insufficient.'
          : '- Learning mode MIXED: Balance video, article, and both across techniques as appropriate.'

  const visual =
    imageStyle === 'diagrams' || imageStyle === 'flowcharts'
      ? `- Visual preference ${imageStyle.toUpperCase()}: Favor contentType "article" or "both" so written guides can carry schematic breakdowns. keyConcepts should use spatial / positional language (stance, angles, sequence). Avoid a roadmap where every technique is only "watch slow-motion" with no form structure.`
      : `- Visual preference "${imageStyle}": apply the usual motor-skill vs theory guidance; keep hooks vivid and concrete.`

  return `

LEARNER PERSONALISATION (must respect — this came from onboarding):
${hours}
${mode}
${visual}
`
}

export const buildPlanPrompt = (
  hobby: string,
  current: SkillLevel,
  target: SkillLevel,
  preferences?: UserPreferences | null
): string => `
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
${preferences ? buildPreferenceInstructions(preferences) : ''}
`

export async function generatePlanTechniques(
  hobby: string,
  currentLevel: SkillLevel,
  targetLevel: SkillLevel,
  preferences?: UserPreferences | null
): Promise<GeminiTechnique[]> {
  const client = getGroqClient()

  const prompt = buildPlanPrompt(hobby, currentLevel, targetLevel, preferences)

  const response = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })

  const text = (response.choices[0]?.message?.content ?? '').trim()

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
