import { create } from 'zustand'
import { Profile } from '../types'

interface AppStore {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  currentUser: Profile | null
  setCurrentUser: (p: Profile | null) => void
}

// For now, a local mock "current user" until Supabase Auth is wired up.
// Replace with a real auth-derived profile once you enable Supabase Auth (see README).
const MOCK_USER: Profile = {
  id: 'local-user',
  full_name: 'Prathikson Jeyakumar',
  initials: 'PJ',
  email: 'dispatch@vingrity.com',
  phone: '780-667-4895',
  role: 'admin',
  status: 'active',
  created_at: new Date().toISOString(),
}

export const useAppStore = create<AppStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  currentUser: MOCK_USER,
  setCurrentUser: (p) => set({ currentUser: p }),
}))


