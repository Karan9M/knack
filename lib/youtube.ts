import type { YouTubeVideo } from '@/types'
import { YOUTUBE_MAX_RESULTS } from '@/constants'

function parseDurationSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return parseInt(m[1] ?? '0') * 3600 + parseInt(m[2] ?? '0') * 60 + parseInt(m[3] ?? '0')
}

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

const SHORTS_CUTOFF_SECONDS = 62

interface SearchItem {
  id: { videoId: string }
  snippet: {
    title: string
    channelTitle: string
    thumbnails: {
      medium?: { url: string }
      default?: { url: string }
    }
  }
}

interface SearchResponse {
  items?: SearchItem[]
  error?: { message: string }
}

interface VideoDetailItem {
  id: string
  contentDetails: { duration: string }
}

interface VideoDetailsResponse {
  items?: VideoDetailItem[]
}

export async function searchYouTubeVideos(
  query: string,
  maxResults: number = YOUTUBE_MAX_RESULTS
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not configured')

  const fetchCount = Math.min(maxResults * 3, 15)

  const searchParams = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: String(fetchCount),
    key: apiKey,
    relevanceLanguage: 'en',
    videoEmbeddable: 'true',
  })

  const searchRes = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams}`, {
    next: { revalidate: 3600 },
  })

  if (!searchRes.ok) {
    const errBody = await searchRes.text().catch(() => '')
    console.warn(
      `[youtube] search.list ${searchRes.status} ${searchRes.statusText}:`,
      errBody.slice(0, 500)
    )
    if (searchRes.status === 403 || searchRes.status === 429 || searchRes.status === 401) {
      return []
    }
    throw new Error(`YouTube API error: ${searchRes.status} ${searchRes.statusText}`)
  }

  const searchData = (await searchRes.json()) as SearchResponse

  if (searchData.error) {
    const msg = searchData.error.message ?? 'Unknown YouTube error'
    console.warn('[youtube] search.list error payload:', msg)
    if (/quota|forbidden|exceeded|403|429|401/i.test(msg)) {
      return []
    }
    throw new Error(`YouTube API error: ${msg}`)
  }

  const candidates = searchData.items ?? []
  if (!candidates.length) return []

  const ids = candidates.map((c) => c.id.videoId).join(',')
  const detailParams = new URLSearchParams({
    part: 'contentDetails',
    id: ids,
    key: apiKey,
  })

  const durationMap: Record<string, number> = {}
  try {
    const detailRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${detailParams}`, {
      next: { revalidate: 3600 },
    })
    if (detailRes.ok) {
      const detailData = (await detailRes.json()) as VideoDetailsResponse
      for (const item of detailData.items ?? []) {
        durationMap[item.id] = parseDurationSeconds(item.contentDetails.duration)
      }
    }
  } catch {
    /* ignore */
  }

  const results: YouTubeVideo[] = []

  for (const item of candidates) {
    if (results.length >= maxResults) break

    const seconds = durationMap[item.id.videoId]

    if (seconds !== undefined && seconds <= SHORTS_CUTOFF_SECONDS) continue

    results.push({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail:
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
      channelName: item.snippet.channelTitle,
      duration: seconds !== undefined ? formatDuration(seconds) : undefined,
    })
  }

  return results
}
