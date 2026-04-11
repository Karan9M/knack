import { type NextRequest } from 'next/server'
import { GROQ_MODEL } from '@/constants'
import { getFirstUserContentPolicyViolation } from '@/lib/contentPolicy'
import { GenerateContentSchema } from '@/lib/validators'
import { saveMdxContent } from '@/lib/db'
import { sanitizeGeneratedMdx } from '@/lib/mdxSanitize'
import { withGroqApiKeyFallback } from '@/lib/groqWithKeyFallback'
import type { UserPreferences } from '@/types'

function buildContentPrompt(
  techniqueName: string,
  hobby: string,
  whyItMatters: string,
  keyConcepts: string[],
  preferences?: UserPreferences | null
): { prompt: string; maxTokens: number } {
  const session = preferences?.sessionLength
  const mode = preferences?.learningMode
  const imageStyle = preferences?.imageStyle

  let length = '380–500'
  let sections =
    '2–3 body sections, each with a short ## heading. Each section is 2–4 sentences of flowing prose.'
  let listRule = 'Write flowing paragraphs, not bullet lists.'
  let maxTokens = 900

  if (session === 'quick') {
    length = '180–280'
    sections =
      mode === 'videos'
        ? '2 body sections with ## headings; keep each section to 2–3 tight sentences (prime what to watch for — no long stories).'
        : '2 body sections with ## headings; keep each section to 2–3 tight sentences.'
    listRule =
      'Mostly short paragraphs; at most one short bullet list for a quick checklist if it genuinely helps.'
    maxTokens = 520
  } else if (session === 'deep') {
    length = '520–700'
    sections =
      '3–4 body sections with ## headings; each section 3–5 sentences with richer explanation and optional analogy.'
    listRule = 'Prefer flowing prose; bullet lists only sparingly for summaries.'
    maxTokens = 1200
  }

  const modeBlock =
    mode === 'videos'
      ? `\nLearning mode: WATCH-FIRST. Keep prose compact; prime what to look for when observing demos. Do not write long cinematic narrative.`
      : mode === 'reading'
        ? `\nLearning mode: READ-FIRST. Prioritize clear explanatory prose; you may use one short bullet list for key takeaways if useful.`
        : mode === 'hands-on'
          ? `\nLearning mode: HANDS-ON. Every section should end with something concrete to try; minimize passive description.`
          : mode === 'mixed'
            ? `\nLearning mode: MIXED. Balance story, explanation, and one actionable recap where natural.`
            : ''

  let diagramTokenBoost = 0
  const diagramBlock =
    imageStyle === 'diagrams' || imageStyle === 'flowcharts'
      ? (() => {
          diagramTokenBoost = 240
          const flowchartRules = `

FLOWCHART MODE (this learner chose **flowcharts** — process & decisions, not generic boxes):
- Add a ## section titled "Visual breakdown".
- Include **one** \`\`\`mermaid fenced block.
- The block MUST start with \`flowchart TD\` or \`flowchart LR\` and read like a **real process map**:
  - Include **branching**: use a **decision diamond** with syntax like \`A{Yes or no?}\` (single braces) and edges such as \`A -->|yes| B\` and \`A -->|no| C\`, **or** at least **two parallel \`subgraph\` lanes** (e.g. "You" vs "Opponent") with 3+ nodes each.
  - **Critical Mermaid syntax:** labeled edges must be \`-->|label| TargetNode\` with a **space** after the closing \`|\`. **Never** write \`-->|label|> TargetNode\` (the \`>\` right after the second \`|\` is invalid and breaks rendering).
  - Do **not** output a boring vertical stack of 4+ plain rectangles with only \`-->\` down the middle and no branches — that is invalid for this mode.
- No ASCII box-drawing (+, |, - grids) anywhere. No \`\`\`text fences.`

          const diagramRules = `

DIAGRAM MODE (this learner chose **diagrams** — structure, space, relationships — **not** the same as a process flowchart):
- Add a ## section titled "Visual breakdown".
- Include **one primary** \`\`\`mermaid fenced block that does **NOT** use a plain \`flowchart TD\` / \`flowchart LR\` as the only diagram type.
- Instead pick **one** of these as the **first line inside the fence** (whichever fits the topic best):
  - \`mindmap\` (concept map with nested ideas — great for chess strategy, language patterns, etc.)
  - \`timeline\` (ordered stages)
  - \`quadrantChart\` (two-axis placement of concepts)
  - \`graph TB\` **with \`subgraph\` clusters** naming zones / layers / components (not a single vertical chain).
- For board / grid topics (chess, formations, courts): only add a **markdown pipe table** when a **full grid** (e.g. 8×8 position) truly helps. **Do not** add a tiny extra table that only repeats starting-piece letters (R N B Q K…) in a second row of boxes beside the mindmap — that looks broken; keep piece-set context inside the mindmap text instead unless you show a real board.
- **Mindmap / timeline / quadrantChart — critical:** use **indentation only** for nesting. **Never** start a nested line with Markdown bullets \`+\`, \`-\`, \`*\`, or numbered \`1.\` — Mermaid will fail. Example (valid):
  \`\`\`
  mindmap
    Root idea
      Child one
      Child two
        Grandchild
  \`\`\`
- Forbidden: long lines made of pipes/dashes outside a proper markdown table; any \`\`\`text fence; using flowchart-only chains like flowchart TD with no subgraphs/mindmap/quadrant/timeline.`

          return imageStyle === 'flowcharts' ? flowchartRules : diagramRules
        })()
      : imageStyle
        ? `\nVisual tone: the reader prefers "${imageStyle}". Use concrete spatial language and mental imagery in prose.`
        : ''

  maxTokens += diagramTokenBoost

  const prompt = `You are writing a lesson article for someone learning ${hobby}. The topic is "${techniqueName}".

Context: ${whyItMatters}
Core concepts to weave in: ${keyConcepts.join(', ')}

Write a rich, editorial-style article — like a chapter in a well-crafted online course. Think Duolingo or a great textbook: warm, intelligent, and precise.${modeBlock}

Structure:
- Open with a single punchy paragraph (2-3 sentences) that frames WHY this technique matters and makes the learner curious.
- Then write ${sections}
- Close with a short motivating paragraph (2-3 sentences) that tells the learner what they'll notice when it starts to click.${diagramBlock}

Rules:
- ${listRule}
- Use ## for section headings only (no ###, no bold fake-headings).
- No meta-commentary like "In this lesson..." or "We will cover...".
- Speak directly to the learner using "you".
- Total length: ${length} words.
- Plain Markdown only. No HTML.`

  return { prompt, maxTokens }
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

    const { techniqueId, techniqueName, hobby, whyItMatters, keyConcepts, preferences } =
      parsed.data

    const contentViolation = getFirstUserContentPolicyViolation([
      techniqueName,
      hobby,
      whyItMatters,
      ...keyConcepts,
    ])
    if (contentViolation) {
      return Response.json({ error: contentViolation }, { status: 400 })
    }

    const { prompt, maxTokens } = buildContentPrompt(
      techniqueName,
      hobby,
      whyItMatters,
      keyConcepts,
      preferences
    )

    const raw = await withGroqApiKeyFallback('generate-content', (client) =>
      client.chat.completions
        .create({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: maxTokens,
        })
        .then((response) => (response.choices[0]?.message?.content ?? '').trim())
    )
    const content = sanitizeGeneratedMdx(raw)

    await saveMdxContent(techniqueId, content)

    return Response.json({ content }, { status: 200 })
  } catch (error) {
    console.error('[generate-content]', error)
    const message = error instanceof Error ? error.message : 'Failed to generate content'
    return Response.json({ error: message }, { status: 500 })
  }
}
