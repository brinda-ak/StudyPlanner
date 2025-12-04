import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PomodoroTimerState {
  // Timer state
  duration: number // minutes
  breakDuration: number // minutes
  isRunning: boolean
  isBreak: boolean
  currentSessionId: number | null
  
  // Track when timer started for background calculation
  startTime: number | null // timestamp when timer started
  initialSeconds: number | null // initial seconds when timer started
  isBreakMode: boolean | null // whether break or focus mode
  
  // Session tracking
  completedSessionsCount: number
  
  // Actions
  setDuration: (minutes: number) => void
  setBreakDuration: (minutes: number) => void
  startTimer: (sessionId: number | null, durationSeconds: number) => void
  startBreak: (breakSeconds: number) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  completeTimer: () => void
  skipBreak: () => void
  
  // Background calculation
  getRemainingTime: () => number // calculates remaining time based on elapsed time
}

export const usePomodoroStore = create<PomodoroTimerState>()(
  persist(
    (set, get) => ({
      duration: 25,
      breakDuration: 5,
      isRunning: false,
      isBreak: false,
      currentSessionId: null,
      startTime: null,
      initialSeconds: null,
      isBreakMode: null,
      completedSessionsCount: 0,

      setDuration: (minutes: number) => {
        set({ duration: minutes })
      },

      setBreakDuration: (minutes: number) => {
        set({ breakDuration: minutes })
      },

      startTimer: (sessionId: number | null, durationSeconds: number) => {
        set({
          isRunning: true,
          isBreak: false,
          currentSessionId: sessionId,
          startTime: Date.now(),
          initialSeconds: durationSeconds,
          isBreakMode: false,
        })
      },

      startBreak: (breakSeconds: number) => {
        set({
          isRunning: true,
          isBreak: true,
          startTime: Date.now(),
          initialSeconds: breakSeconds,
          isBreakMode: true,
        })
      },

      pauseTimer: () => {
        const state = get()
        const remaining = state.getRemainingTime()
        set({
          isRunning: false,
          startTime: null,
          initialSeconds: remaining > 0 ? remaining : null,
        })
      },

      resumeTimer: () => {
        const state = get()
        const remaining = state.getRemainingTime()
        if (remaining > 0) {
          set({
            isRunning: true,
            startTime: Date.now(),
            initialSeconds: remaining,
          })
        }
      },

      stopTimer: () => {
        set({
          isRunning: false,
          isBreak: false,
          currentSessionId: null,
          startTime: null,
          initialSeconds: null,
          isBreakMode: null,
        })
      },

      completeTimer: () => {
        const state = get()
        const newCount = state.completedSessionsCount + 1
        set({
          isRunning: false,
          currentSessionId: null,
          startTime: null,
          initialSeconds: null,
          isBreakMode: null,
          completedSessionsCount: newCount,
        })
      },

      skipBreak: () => {
        set({
          isBreak: false,
          isRunning: false,
          startTime: null,
          initialSeconds: null,
          isBreakMode: null,
        })
      },

      // Calculate remaining time based on elapsed time since start
      getRemainingTime: () => {
        const state = get()
        
        // If timer is running, calculate based on elapsed time
        if (state.isRunning && state.startTime && state.initialSeconds !== null) {
          const elapsed = Math.floor((Date.now() - state.startTime) / 1000)
          const remaining = state.initialSeconds - elapsed
          return Math.max(0, remaining)
        }
        
        // If paused, return stored remaining time
        if (!state.isRunning && state.initialSeconds !== null) {
          return state.initialSeconds
        }
        
        // If not running and no timer started, return duration for display
        if (state.isBreak) {
          return state.breakDuration * 60
        } else {
          return state.duration * 60
        }
      },
    }),
    {
      name: 'pomodoro-storage',
    }
  )
)

