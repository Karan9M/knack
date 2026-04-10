import { type NextRequest } from 'next/server'
import { fetchWikipediaImage } from '@/lib/wikipedia'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')
    if (!q) {
      return Response.json({ error: 'Missing query param q' }, { status: 400 })
    }

    const image = await fetchWikipediaImage(q)
    return Response.json({ image }, { status: 200 })
  } catch (error) {
    console.error('[wikipedia]', error)
    return Response.json({ error: 'Failed to fetch Wikipedia data' }, { status: 500 })
  }
}
