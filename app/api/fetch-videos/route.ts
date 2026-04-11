import { type NextRequest } from 'next/server'
import { getUserContentPolicyViolation } from '@/lib/contentPolicy'
import { FetchVideosSchema } from '@/lib/validators'
import { searchYouTubeVideos } from '@/lib/youtube'

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const parsed = FetchVideosSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { query } = parsed.data
    const queryViolation = getUserContentPolicyViolation(query)
    if (queryViolation) {
      return Response.json({ error: queryViolation }, { status: 400 })
    }
    const videos = await searchYouTubeVideos(query)

    return Response.json({ videos }, { status: 200 })
  } catch (error) {
    console.error('[fetch-videos]', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch videos'
    return Response.json({ error: message }, { status: 500 })
  }
}
