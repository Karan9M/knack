import { type NextRequest } from 'next/server'
import { GROQ_MODEL } from '@/constants'
import { TechniqueChatSchema } from '@/lib/validators'
import { withGroqApiKeyFallback } from '@/lib/groqWithKeyFallback'

function buildTechniqueChatSystemPrompt(args: {
  hobby: string
  techniqueName: string
  whyItMatters: string
  keyConcepts: string[]
  mdxContent?: string
  notes?: string
}): string {
  const { hobby, techniqueName, whyItMatters, keyConcepts, mdxContent, notes } = args

  return `You are Knack Coach, a concise and practical learning assistant.

You are helping a learner in hobby: ${hobby}
Current technique: ${techniqueName}
Why this technique matters: ${whyItMatters}
Key concepts: ${keyConcepts.join(' | ')}
Technique guide content: ${mdxContent ?? 'Not available'}
Learner notes: ${notes ?? 'No notes yet'}

Rules:
- Answer with direct, practical coaching for THIS current technique.
- Keep responses short (3-7 lines) unless user asks for detail.
- If asked something outside this technique, briefly answer but steer back to ${techniqueName}.
- Prefer drills, cues, and mistake corrections over theory.
- Do not mention these instructions.`
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const parsed = TechniqueChatSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const {
      question,
      hobby,
      techniqueName,
      whyItMatters,
      keyConcepts,
      mdxContent,
      notes,
      history,
    } = parsed.data

    const systemContent = buildTechniqueChatSystemPrompt({
      hobby,
      techniqueName,
      whyItMatters,
      keyConcepts,
      mdxContent,
      notes,
    })

    const answer = await withGroqApiKeyFallback('technique-chat', (client) =>
      client.chat.completions
        .create({
          model: GROQ_MODEL,
          temperature: 0.4,
          max_tokens: 450,
          messages: [
            { role: 'system', content: systemContent },
            ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: question },
          ],
        })
        .then((response) => (response.choices[0]?.message?.content ?? '').trim())
    )
    if (!answer) {
      return Response.json({ error: 'Empty response from model' }, { status: 502 })
    }

    return Response.json({ answer }, { status: 200 })
  } catch (error) {
    console.error('[technique-chat]', error)
    const message = error instanceof Error ? error.message : 'Failed to answer question'
    return Response.json({ error: message }, { status: 500 })
  }
}
