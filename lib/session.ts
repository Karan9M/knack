'use client'

import { generateId } from '@/lib/utils'

const SESSION_KEY = 'knack_session_id'

export function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY)
    if (existing) return existing

    // Generate a UUID-like ID using crypto if available, fallback to generateId
    const newId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : generateId()

    localStorage.setItem(SESSION_KEY, newId)
    return newId
  } catch {
    // Private browsing or SSR — return a temporary ID
    return generateId()
  }
}
