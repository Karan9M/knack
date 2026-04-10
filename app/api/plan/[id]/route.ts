import { type NextRequest } from 'next/server'
import { getPlanById } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const plan = await getPlanById(id)

    if (!plan) {
      return Response.json({ error: 'Plan not found' }, { status: 404 })
    }

    return Response.json({ plan }, { status: 200 })
  } catch (error) {
    console.error('[plan/get]', error)
    return Response.json({ error: 'Failed to fetch plan' }, { status: 500 })
  }
}
