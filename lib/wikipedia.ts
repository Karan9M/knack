import type { WikipediaImage } from '@/types'

interface WikipediaSummary {
  title: string
  extract: string
  thumbnail?: {
    source: string
    width: number
    height: number
  }
  originalimage?: {
    source: string
    width: number
    height: number
  }
  description?: string
}

interface WikipediaSearchResult {
  query?: {
    search: Array<{ title: string; snippet: string }>
  }
}

export async function fetchWikipediaImage(query: string): Promise<WikipediaImage | null> {
  try {
    const searchUrl =
      `https://en.wikipedia.org/w/api.php?` +
      new URLSearchParams({
        action: 'query',
        list: 'search',
        srsearch: query,
        srlimit: '1',
        format: 'json',
        origin: '*',
      })

    const searchRes = await fetch(searchUrl, { next: { revalidate: 86400 } })
    if (!searchRes.ok) return null

    const searchData = (await searchRes.json()) as WikipediaSearchResult
    const firstResult = searchData.query?.search?.[0]
    if (!firstResult) return null

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      firstResult.title
    )}`

    const summaryRes = await fetch(summaryUrl, { next: { revalidate: 86400 } })
    if (!summaryRes.ok) return null

    const summary = (await summaryRes.json()) as WikipediaSummary

    const imageUrl = summary.originalimage?.source ?? summary.thumbnail?.source

    if (!imageUrl) return null

    return {
      url: imageUrl,
      caption: summary.description ?? summary.extract.slice(0, 120),
      pageTitle: summary.title,
    }
  } catch {
    return null
  }
}
