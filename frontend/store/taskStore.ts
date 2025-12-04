import { create } from 'zustand'
import { Task, tasksAPI } from '@/lib/api'

interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
  fetchTasks: () => Promise<void>
  addTask: (task: Partial<Task>) => Promise<void>
  updateTask: (id: number, task: Partial<Task>) => Promise<void>
  deleteTask: (id: number) => Promise<void>
  reorderTasks: (taskIds: number[]) => Promise<void>
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  fetchTasks: async () => {
    set({ loading: true, error: null })
    try {
      const tasks = await tasksAPI.getAll()
      set({ tasks, loading: false })
    } catch (error: any) {
      set({ error: error.message, loading: false })
    }
  },
  addTask: async (task) => {
    try {
      const newTask = await tasksAPI.create(task)
      set((state) => ({ tasks: [...state.tasks, newTask] }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },
  updateTask: async (id, task) => {
    try {
      const updatedTask = await tasksAPI.update(id, task)
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },
  deleteTask: async (id) => {
    try {
      await tasksAPI.delete(id)
      set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },
  reorderTasks: async (taskIds) => {
    try {
      await tasksAPI.reorder(taskIds)
      // Optimistically update local state
      const { tasks } = get()
      const taskMap = new Map(tasks.map((t) => [t.id, t]))
      const reorderedTasks = taskIds.map((id) => taskMap.get(id)!).filter(Boolean)
      set({ tasks: reorderedTasks })
    } catch (error: any) {
      set({ error: error.message })
      // Re-fetch on error
      get().fetchTasks()
    }
  },
}))

