'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePlanStore } from '@/store/planStore'

type SaveStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'error'

interface UseTechniqueNotesArgs {
  techniqueId: string
  initialNotes?: string
}

function draftKey(techniqueId: string) {
  return `knack_notes_draft_${techniqueId}`
}

export function useTechniqueNotes({ techniqueId, initialNotes }: UseTechniqueNotesArgs) {
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<SaveStatus>('idle')
  const debounceRef = useRef<number | null>(null)
  const savedFadeRef = useRef<number | null>(null)
  const updateTechniqueNotes = usePlanStore((s) => s.updateTechniqueNotes)

  const clearTimers = useCallback(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    if (savedFadeRef.current) {
      window.clearTimeout(savedFadeRef.current)
      savedFadeRef.current = null
    }
  }, [])

  const persist = useCallback(
    async (nextNotes: string) => {
      setStatus('saving')
      try {
        const res = await fetch(`/api/technique/${techniqueId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'notes', notes: nextNotes }),
        })

        if (!res.ok) throw new Error('Failed to save notes')
        setStatus('saved')
        localStorage.removeItem(draftKey(techniqueId))

        if (savedFadeRef.current) window.clearTimeout(savedFadeRef.current)
        savedFadeRef.current = window.setTimeout(() => setStatus('idle'), 1200)
      } catch {
        setStatus('error')
      }
    },
    [techniqueId]
  )

  useEffect(() => {
    clearTimers()
    const draft = localStorage.getItem(draftKey(techniqueId))
    setNotes(draft ?? initialNotes ?? '')
    setStatus('idle')
  }, [clearTimers, initialNotes, techniqueId])

  useEffect(() => clearTimers, [clearTimers])

  const onChange = useCallback(
    (nextNotes: string) => {
      setNotes(nextNotes)
      setStatus('typing')
      updateTechniqueNotes(techniqueId, nextNotes)
      localStorage.setItem(draftKey(techniqueId), nextNotes)

      if (debounceRef.current) window.clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(() => {
        persist(nextNotes)
      }, 1000)
    },
    [persist, techniqueId, updateTechniqueNotes]
  )

  return { notes, status, onChange }
}
