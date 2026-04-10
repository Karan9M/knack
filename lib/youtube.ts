import type { YouTubeVideo } from '@/types'
import { YOUTUBE_MAX_RESULTS } from '@/constants'

// ─── Duration helpers ─────────────────────────────────────────────────────────

/** Parse ISO 8601 duration (PT1H30M15S) to total seconds. */
function parseDurationSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return parseInt(m[1] ?? '0') * 3600 + parseInt(m[2] ?? '0') * 60 + parseInt(m[3] ?? '0')
}

/** Format seconds as "M:SS" or "H:MM:SS" for display. */
function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

// YouTube Shorts are ≤ 60 s. Use 62 s as the cutoff to handle encoding rounding.
const SHORTS_CUTOFF_SECONDS = 62

// ─── API response shapes ──────────────────────────────────────────────────────

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

// ─── Main export ──────────────────────────────────────────────────────────────

export async function searchYouTubeVideos(
  query: string,
  maxResults: number = YOUTUBE_MAX_RESULTS
): Promise<YouTubeVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) throw new Error('YOUTUBE_API_KEY is not configured')

  // Fetch 3× candidates so we still hit maxResults after Shorts are filtered out
  const fetchCount = Math.min(maxResults * 3, 15)

  // ── Step 1: search.list ───────────────────────────────────────────────────
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
    throw new Error(`YouTube API error: ${searchRes.status} ${searchRes.statusText}`)
  }

  const searchData = (await searchRes.json()) as SearchResponse

  if (searchData.error) {
    throw new Error(`YouTube API error: ${searchData.error.message}`)
  }

  const candidates = searchData.items ?? []
  if (!candidates.length) return []

  // ── Step 2: videos.list (contentDetails) — cheap at 1 quota unit ─────────
  // Gets exact ISO 8601 durations so we can reliably detect Shorts (≤ 62 s).
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
    // Non-fatal — if duration fetch fails we fall through without filtering
  }

  // ── Step 3: filter Shorts, take up to maxResults ──────────────────────────
  const results: YouTubeVideo[] = []

  for (const item of candidates) {
    if (results.length >= maxResults) break

    const seconds = durationMap[item.id.videoId]

    // If we have duration data and it's a Short, skip it
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
