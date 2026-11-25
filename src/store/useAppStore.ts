import { create } from 'zustand'
import { Profile } from '../types'

interface AppStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  currentUser: Profile | null
  setCurrentUser: (p: Profile | null) => void
  isAuthLoading: boolean
  setIsAuthLoading: (loading: boolean) => void
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  currentUser: null,
  setCurrentUser: (p) => set({ currentUser: p }),
  isAuthLoading: true,
  setIsAuthLoading: (loading) => set({ isAuthLoading: loading }),
}))