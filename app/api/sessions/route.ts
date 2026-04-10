import { type NextRequest } from 'next/server'
import { z } from 'zod'
import { getSessionPlans, updateStreak, getStreak } from '@/lib/db'

const SessionSchema = z.object({
  sessionId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const parsed = SessionSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: 'Invalid session ID' }, { status: 400 })
    }

    const { sessionId } = parsed.data
    const [plans, streak] = await Promise.all([getSessionPlans(sessionId), getStreak(sessionId)])

    return Response.json({ plans, streak }, { status: 200 })
  } catch (error) {
    console.error('[sessions]', error)
    return Response.json({ error: 'Failed to fetch session data' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const parsed = SessionSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json({ error: 'Invalid session ID' }, { status: 400 })
    }

    const streak = await updateStreak(parsed.data.sessionId)
    return Response.json({ streak }, { status: 200 })
  } catch (error) {
    console.error('[sessions/streak]', error)
    return Response.json({ error: 'Failed to update streak' }, { status: 500 })
  }
}
