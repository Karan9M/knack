import Groq from 'groq-sdk'
import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  InternalServerError,
  RateLimitError,
} from 'groq-sdk'

/**
 * Ordered Groq API keys: primary `GROQ_API_KEY`, then optional `GROQ_API_KEY_FALLBACK`.
 * Duplicates are removed so the same key is not tried twice.
 */
export function getGroqApiKeysInOrder(): string[] {
  const raw = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_FALLBACK]
    .map((k) => k?.trim())
    .filter((k): k is string => Boolean(k))
  return [...new Set(raw)]
}

/** True when retrying with another Groq API key may help (rate limits, transient server / network errors). */
export function groqTransientForKeyFallback(error: unknown): boolean {
  if (error instanceof RateLimitError) return true
  if (error instanceof APIConnectionError) return true
  if (error instanceof APIConnectionTimeoutError) return true
  if (error instanceof InternalServerError) return true
  if (error instanceof APIError) {
    const s = error.status
    if (s === 429 || s === 503 || s === 502) return true
    if (typeof s === 'number' && s >= 500 && s < 600) return true
  }
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  if (msg.includes('rate limit') || msg.includes('too many requests')) return true
  return false
}

/**
 * Runs `run(client)` with the first configured Groq key; on transient failure, retries with the next key (same Groq API, separate quota).
 */
export async function withGroqApiKeyFallback<T>(
  logLabel: string,
  run: (client: Groq) => Promise<T>
): Promise<T> {
  const keys = getGroqApiKeysInOrder()
  if (keys.length === 0) throw new Error('GROQ_API_KEY is not configured')

  let lastError: unknown
  for (let i = 0; i < keys.length; i++) {
    const client = new Groq({ apiKey: keys[i] })
    try {
      return await run(client)
    } catch (error) {
      lastError = error
      const hasAnotherKey = i < keys.length - 1
      if (!hasAnotherKey || !groqTransientForKeyFallback(error)) throw error
      const reason = error instanceof Error ? error.message : String(error)
      console.warn(`[${logLabel}] Groq key ${i + 1} failed (${reason}); retrying with fallback key`)
    }
  }
  throw lastError
}
