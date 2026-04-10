import Groq from 'groq-sdk'

/**
 * Single construction point for the Groq SDK from server environment.
 * Keeps API key validation consistent across routes and plan generation.
 */
export class GroqClientService {
  readonly sdk: Groq

  private constructor(apiKey: string) {
    this.sdk = new Groq({ apiKey })
  }

  static fromEnv(): GroqClientService {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured')
    return new GroqClientService(apiKey)
  }
}
