import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserPreferences } from '@/types'

interface UIState {
  selectedTechniqueId: string | null
  isSheetOpen: boolean
  preferences: UserPreferences | null

  openTechnique: (techniqueId: string) => void
  closeSheet: () => void
  setSelectedTechniqueId: (id: string | null) => void
  setPreferences: (prefs: UserPreferences) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedTechniqueId: null,
      isSheetOpen: false,
      preferences: null,

      openTechnique: (techniqueId: string) =>
        set({ selectedTechniqueId: techniqueId, isSheetOpen: true }),

      closeSheet: () => set({ isSheetOpen: false }),

      setSelectedTechniqueId: (id: string | null) =>
        set({ selectedTechniqueId: id, isSheetOpen: id !== null }),

      setPreferences: (prefs: UserPreferences) => set({ preferences: prefs }),
    }),
    {
      name: 'knack-ui',
      // Only persist preferences — transient UI state is not saved
      partialize: (state) => ({ preferences: state.preferences }),
    }
  )
)
