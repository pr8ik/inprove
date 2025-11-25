import { create } from 'zustand'

interface ActiveTimer {
    startTime: Date
    categoryIds: string[]
    taskName: string
    note?: string
    valueScore?: string
}

interface AppState {
    activeTimer: ActiveTimer | null
    theme: 'dark' | 'light'
    setActiveTimer: (timer: ActiveTimer | null) => void
    toggleTheme: () => void
}

export const useStore = create<AppState>((set) => ({
    activeTimer: null,
    theme: 'dark',
    setActiveTimer: (timer) => set({ activeTimer: timer }),
    toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
}))
