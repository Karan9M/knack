import { create } from 'zustand'
import type { Plan, Technique, TechniqueStatus, YouTubeVideo } from '@/types'

interface PlanState {
  activePlan: Plan | null
  isLoaded: boolean

  // Actions
  setPlan: (plan: Plan) => void
  updateTechniqueStatus: (techniqueId: string, status: TechniqueStatus) => void
  updateTechniqueMdx: (techniqueId: string, content: string) => void
  updateTechniqueVideos: (techniqueId: string, videos: YouTubeVideo[]) => void
  updateTechniqueWikipedia: (techniqueId: string, image: Technique['wikipediaImage']) => void
  updateTechniqueGeneratedImage: (techniqueId: string, url: string) => void
  reset: () => void
}

function patchTechnique(plan: Plan, techniqueId: string, patch: Partial<Technique>): Plan {
  return {
    ...plan,
    techniques: plan.techniques.map((t) => (t.id === techniqueId ? { ...t, ...patch } : t)),
  }
}

export const usePlanStore = create<PlanState>((set, get) => ({
  activePlan: null,
  isLoaded: false,

  setPlan: (plan: Plan) => set({ activePlan: plan, isLoaded: true }),

  updateTechniqueStatus: (techniqueId: string, status: TechniqueStatus) => {
    const { activePlan } = get()
    if (!activePlan) return

    // Optimistic update in-memory
    set({
      activePlan: patchTechnique(activePlan, techniqueId, {
        status,
        completedAt: status === 'mastered' ? new Date().toISOString() : undefined,
      }),
    })

    // Persist to Supabase via API
    fetch(`/api/technique/${techniqueId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', status }),
    }).catch((err) => console.error('[updateTechniqueStatus]', err))
  },

  updateTechniqueMdx: (techniqueId: string, content: string) => {
    const { activePlan } = get()
    if (!activePlan) return
    set({ activePlan: patchTechnique(activePlan, techniqueId, { mdxContent: content }) })
  },

  updateTechniqueVideos: (techniqueId: string, videos: YouTubeVideo[]) => {
    const { activePlan } = get()
    if (!activePlan) return
    set({
      activePlan: patchTechnique(activePlan, techniqueId, {
        resources: {
          ...activePlan.techniques.find((t) => t.id === techniqueId)!.resources,
          videoCache: videos,
        },
      }),
    })
  },

  updateTechniqueWikipedia: (techniqueId: string, image: Technique['wikipediaImage']) => {
    const { activePlan } = get()
    if (!activePlan) return
    set({ activePlan: patchTechnique(activePlan, techniqueId, { wikipediaImage: image }) })
  },

  updateTechniqueGeneratedImage: (techniqueId: string, url: string) => {
    const { activePlan } = get()
    if (!activePlan) return
    set({ activePlan: patchTechnique(activePlan, techniqueId, { generatedImage: url }) })
  },

  reset: () => set({ activePlan: null, isLoaded: false }),
}))
