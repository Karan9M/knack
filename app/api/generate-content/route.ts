import { type NextRequest } from 'next/server'
import { GenerateContentSchema } from '@/lib/validators'
import { saveMdxContent } from '@/lib/db'
import { GroqClientService } from '@/lib/services/groq-client.service'

function buildContentPrompt(
  techniqueName: string,
  hobby: string,
  whyItMatters: string,
  keyConcepts: string[]
): string {
  return `You are writing a lesson article for someone learning ${hobby}. The topic is "${techniqueName}".

Context: ${whyItMatters}
Core concepts to weave in: ${keyConcepts.join(', ')}

Write a rich, editorial-style article — like a chapter in a well-crafted online course. Think Duolingo or a great textbook: warm, intelligent, and precise. Not a bullet-point cheat sheet.

Structure:
- Open with a single punchy paragraph (2-3 sentences) that frames WHY this technique matters and makes the learner curious.
- Then write 2-3 body sections, each with a short ## heading. Each section is 2-4 sentences of flowing prose. Explain concepts naturally, use analogies where helpful.
- Close with a short motivating paragraph (2-3 sentences) that tells the learner what they'll notice when it starts to click.

Rules:
- Write flowing paragraphs, not bullet lists.
- Use ## for section headings only (no ###, no bold fake-headings).
- No meta-commentary like "In this lesson..." or "We will cover...".
- Speak directly to the learner using "you".
- Total length: 380–500 words.
- Plain Markdown only. No HTML.`
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const parsed = GenerateContentSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { techniqueId, techniqueName, hobby, whyItMatters, keyConcepts } = parsed.data

    const client = GroqClientService.fromEnv().sdk
    const prompt = buildContentPrompt(techniqueName, hobby, whyItMatters, keyConcepts)

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 900,
    })

    const content = (response.choices[0]?.message?.content ?? '').trim()

    // Persist to Supabase
    await saveMdxContent(techniqueId, content)

    return Response.json({ content }, { status: 200 })
  } catch (error) {
    console.error('[generate-content]', error)
    const message = error instanceof Error ? error.message : 'Failed to generate content'
    return Response.json({ error: message }, { status: 500 })
  }
}
