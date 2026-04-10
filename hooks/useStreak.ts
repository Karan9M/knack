'use client'

import { useState, useCallback } from 'react'
import { getSessionId } from '@/lib/session'
import type { StreakData } from '@/types'

interface UseStreakReturn {
  streak: StreakData
  bumpStreak: () => Promise<void>
}

export function useStreak(initialStreak?: StreakData): UseStreakReturn {
  const [streak, setStreak] = useState<StreakData>(
    initialStreak ?? { count: 0, lastActiveDate: '' }
  )

  const bumpStreak = useCallback(async () => {
    try {
      const sessionId = getSessionId()
      const res = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      if (res.ok) {
        const data = (await res.json()) as { streak: StreakData }
        setStreak(data.streak)
      }
    } catch (err) {
      console.error('[useStreak]', err)
    }
  }, [])

  return { streak, bumpStreak }
}
