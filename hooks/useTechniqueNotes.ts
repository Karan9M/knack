'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getUserContentPolicyViolation } from '@/lib/contentPolicy'
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
  const [saveError, setSaveError] = useState<string | null>(null)
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
      const violation = getUserContentPolicyViolation(nextNotes)
      if (violation) {
        setSaveError(violation)
        setStatus('error')
        return
      }
      setSaveError(null)
      setStatus('saving')
      try {
        const res = await fetch(`/api/technique/${techniqueId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'notes', notes: nextNotes }),
        })

        const data = (await res.json().catch(() => null)) as { error?: string } | null
        if (!res.ok) {
          setSaveError(typeof data?.error === 'string' ? data.error : 'Could not save notes')
          setStatus('error')
          return
        }
        setSaveError(null)
        setStatus('saved')
        localStorage.removeItem(draftKey(techniqueId))

        if (savedFadeRef.current) window.clearTimeout(savedFadeRef.current)
        savedFadeRef.current = window.setTimeout(() => setStatus('idle'), 1200)
      } catch {
        setSaveError('Could not save notes')
        setStatus('error')
      }
    },
    [techniqueId]
  )

  useEffect(() => {
    clearTimers()
    const draft = localStorage.getItem(draftKey(techniqueId))
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate draft when switching technique */
    setNotes(draft ?? initialNotes ?? '')
    setStatus('idle')
    setSaveError(null)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [clearTimers, initialNotes, techniqueId])

  useEffect(() => clearTimers, [clearTimers])

  const onChange = useCallback(
    (nextNotes: string) => {
      setNotes(nextNotes)
      setStatus('typing')
      if (saveError) setSaveError(null)
      updateTechniqueNotes(techniqueId, nextNotes)
      localStorage.setItem(draftKey(techniqueId), nextNotes)

      if (debounceRef.current) window.clearTimeout(debounceRef.current)
      debounceRef.current = window.setTimeout(() => {
        persist(nextNotes)
      }, 1000)
    },
    [persist, saveError, techniqueId, updateTechniqueNotes]
  )

  return { notes, status, onChange, saveError }
}
