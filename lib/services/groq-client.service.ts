import Groq from 'groq-sdk'
import { getGroqApiKeysInOrder } from '@/lib/groqWithKeyFallback'

/**
 * Groq SDK from the primary env key only.
 * Prefer {@link withGroqApiKeyFallback} from `@/lib/groqWithKeyFallback` when calling the API so a secondary key can be used on rate limits.
 */
export class GroqClientService {
  readonly sdk: Groq

  private constructor(apiKey: string) {
    this.sdk = new Groq({ apiKey })
  }

  static fromEnv(): GroqClientService {
    const keys = getGroqApiKeysInOrder()
    if (keys.length === 0) throw new Error('GROQ_API_KEY is not configured')
    return new GroqClientService(keys[0])
  }
}
