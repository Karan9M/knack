import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { getUserContentPolicyViolation } from '@/lib/contentPolicy'
import {
  updateTechniqueStatus,
  cacheVideoResults,
  saveMdxContent,
  saveWikipediaImage,
  saveGeneratedImage,
  saveTechniqueNotes,
} from '@/lib/db'
import type { YouTubeVideo, WikipediaImage } from '@/types'

const PatchBodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('status'),
    status: z.enum(['pending', 'mastered', 'skipped']),
  }),
  z.object({
    action: z.literal('cacheVideos'),
    videos: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        thumbnail: z.string(),
        channelName: z.string(),
        duration: z.string().optional(),
      })
    ),
  }),
  z.object({
    action: z.literal('mdxContent'),
    content: z.string(),
  }),
  z.object({
    action: z.literal('wikipediaImage'),
    image: z.object({
      url: z.string(),
      caption: z.string(),
      pageTitle: z.string(),
    }),
  }),
  z.object({
    action: z.literal('generatedImage'),
    url: z.string().url(),
  }),
  z.object({
    action: z.literal('notes'),
    notes: z.string().max(5000),
  }),
])

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body: unknown = await req.json()
    const parsed = PatchBodySchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    switch (parsed.data.action) {
      case 'status':
        await updateTechniqueStatus(id, parsed.data.status)
        break
      case 'cacheVideos':
        await cacheVideoResults(id, parsed.data.videos as YouTubeVideo[])
        break
      case 'mdxContent':
        await saveMdxContent(id, parsed.data.content)
        break
      case 'wikipediaImage':
        await saveWikipediaImage(id, parsed.data.image as WikipediaImage)
        break
      case 'generatedImage':
        await saveGeneratedImage(id, parsed.data.url)
        break
      case 'notes': {
        const notesViolation = getUserContentPolicyViolation(parsed.data.notes)
        if (notesViolation) {
          return Response.json({ error: notesViolation }, { status: 400 })
        }
        await saveTechniqueNotes(id, parsed.data.notes)
        break
      }
    }

    return Response.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('[technique/patch]', error)
    return Response.json({ error: 'Failed to update technique' }, { status: 500 })
  }
}
