import { type NextRequest } from 'next/server'
import { z } from 'zod'

const RequestSchema = z.object({
  techniqueId: z.string().uuid().optional(),
  techniqueName: z.string().min(1),
  hobby: z.string().min(1),
  contentType: z.enum(['video', 'article', 'both']).default('both'),
  imageStyle: z.enum(['illustrations', 'cartoons', 'ghibli', 'diagrams', 'flowcharts']).optional(),
})

/** Distinct Pexels search hooks so cartoon ≠ Ghibli ≠ vector (stock search is fuzzy; we bias hard). */
const ART_STYLE_QUERY: Record<'illustrations' | 'cartoons' | 'ghibli', string> = {
  illustrations:
    'minimal flat vector illustration clean geometric editorial digital painting stylized not photograph',
  cartoons:
    'cartoon illustration bold outlines cel shaded vibrant colors comic style exaggerated stylized character not photograph',
  ghibli:
    'anime watercolor painting soft pastel dreamy clouds hand painted illustrative landscape scene stylized not photograph',
}

const SCHEMATIC_STYLE_QUERY: Record<'diagrams' | 'flowcharts', string> = {
  diagrams: 'technical diagram blueprint schematic educational illustration',
  flowcharts: 'flowchart infographic process chart diagram educational',
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

function hashSeed(parts: string): number {
  let h = 0
  for (let i = 0; i < parts.length; i++) h = (Math.imul(31, h) + parts.charCodeAt(i)) | 0
  return Math.abs(h)
}

async function searchPexelsPage(
  query: string,
  page: number,
  perPage: number
): Promise<PexelsPhoto[]> {
  const key = process.env.PEXELS_API_KEY
  if (!key || key === 'your_pexels_key_here') return []

  const url = new URL('https://api.pexels.com/v1/search')
  url.searchParams.set('query', query)
  url.searchParams.set('page', String(Math.max(1, page)))
  url.searchParams.set('per_page', String(Math.min(40, Math.max(1, perPage))))
  url.searchParams.set('orientation', 'landscape')
  url.searchParams.set('size', 'medium')

  const res = await fetch(url.toString(), {
    headers: { Authorization: key },
    next: { revalidate: 86400 },
  })

  if (!res.ok) return []
  const data = (await res.json()) as PexelsResponse
  return data.photos ?? []
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

    const { techniqueId, techniqueName, hobby, contentType, imageStyle } = parsed.data

    if (!process.env.PEXELS_API_KEY || process.env.PEXELS_API_KEY === 'your_pexels_key_here') {
      return Response.json({ error: 'Image search not configured' }, { status: 503 })
    }

    const seed = hashSeed(`${techniqueId ?? ''}|${imageStyle ?? ''}|${techniqueName}|${hobby}`)
    const page = 1 + (seed % 4)
    const perPage = 15

    let primaryQuery: string
    let fallbackQuery: string

    if (imageStyle === 'illustrations' || imageStyle === 'cartoons' || imageStyle === 'ghibli') {
      const hook = ART_STYLE_QUERY[imageStyle]
      primaryQuery = [hook, hobby, techniqueName, 'skill learning practice']
        .filter(Boolean)
        .join(' ')
      fallbackQuery = [hook, hobby, 'tutorial practice'].join(' ')
    } else if (imageStyle === 'diagrams' || imageStyle === 'flowcharts') {
      const hook = SCHEMATIC_STYLE_QUERY[imageStyle]
      primaryQuery = [techniqueName, hobby, hook].join(' ')
      fallbackQuery = [hobby, hook, contentType === 'video' ? 'sports technique' : '']
        .filter(Boolean)
        .join(' ')
    } else {
      primaryQuery = [techniqueName, hobby, 'illustration learning'].join(' ')
      fallbackQuery = [hobby, 'skill tutorial'].join(' ')
    }

    let photos = await searchPexelsPage(primaryQuery, page, perPage)
    if (photos.length === 0) photos = await searchPexelsPage(primaryQuery, 1, perPage)
    if (photos.length === 0)
      photos = await searchPexelsPage(fallbackQuery, 1 + ((seed >> 3) % 3), perPage)
    if (photos.length === 0) photos = await searchPexelsPage(fallbackQuery, 1, perPage)

    if (photos.length === 0) {
      return Response.json({ error: 'No image found' }, { status: 404 })
    }

    const pick = photos[seed % photos.length] ?? photos[0]

    return Response.json({
      url: pick.src.large,
      photographer: pick.photographer,
      photographerUrl: pick.photographer_url,
      alt: pick.alt || `${techniqueName} in ${hobby}`,
    })
  } catch (error) {
    console.error('[generate-image]', error)
    return Response.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
