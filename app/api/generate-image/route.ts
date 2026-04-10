import { type NextRequest } from 'next/server'
import { z } from 'zod'

const RequestSchema = z.object({
  techniqueName: z.string().min(1),
  hobby: z.string().min(1),
  contentType: z.enum(['video', 'article', 'both']).default('both'),
  imageStyle: z.enum(['illustrations', 'cartoons', 'ghibli', 'diagrams', 'flowcharts']).optional(),
})

// Map the user's chosen art style to a Pexels search modifier
const STYLE_MODIFIER: Record<string, string> = {
  illustrations: 'illustration art',
  cartoons: 'cartoon drawing',
  ghibli: 'watercolor painting art',
  diagrams: 'diagram technical',
  flowcharts: 'infographic chart',
}

interface PexelsPhoto {
  id: number
  photographer: string
  photographer_url: string
  src: {
    large: string
    medium: string
  }
  alt: string
}

interface PexelsResponse {
  total_results: number
  photos: PexelsPhoto[]
}

async function searchPexels(query: string): Promise<PexelsPhoto | null> {
  const key = process.env.PEXELS_API_KEY
  if (!key || key === 'your_pexels_key_here') return null

  const url = new URL('https://api.pexels.com/v1/search')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', '1')
  url.searchParams.set('orientation', 'landscape')
  url.searchParams.set('size', 'medium')

  const res = await fetch(url.toString(), {
    headers: { Authorization: key },
    next: { revalidate: 86400 }, // cache for 24h at the CDN level
  })

  if (!res.ok) return null
  const data = (await res.json()) as PexelsResponse
  return data.photos?.[0] ?? null
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()
    const parsed = RequestSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { techniqueName, hobby, contentType, imageStyle } = parsed.data

    if (!process.env.PEXELS_API_KEY || process.env.PEXELS_API_KEY === 'your_pexels_key_here') {
      return Response.json({ error: 'Image search not configured' }, { status: 503 })
    }

    const styleModifier = imageStyle ? (STYLE_MODIFIER[imageStyle] ?? '') : ''

    // Build a specific query first, then fall back to the hobby name only
    const specificQuery = [techniqueName, hobby, styleModifier].filter(Boolean).join(' ')
    const fallbackQuery = [hobby, styleModifier, contentType === 'video' ? 'technique' : '']
      .filter(Boolean)
      .join(' ')

    let photo = await searchPexels(specificQuery)
    if (!photo) photo = await searchPexels(fallbackQuery)
    if (!photo) {
      return Response.json({ error: 'No image found' }, { status: 404 })
    }

    return Response.json({
      url: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      alt: photo.alt || `${techniqueName} in ${hobby}`,
    })
  } catch (error) {
    console.error('[generate-image]', error)
    return Response.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
