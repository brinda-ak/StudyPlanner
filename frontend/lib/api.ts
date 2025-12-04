import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle 401 errors (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export interface Task {
  id: number
  title: string
  description?: string
  due_date?: string
  priority: string
  category?: string
  completed: boolean
  user_id: number
  created_at: string
  updated_at?: string
  order_index: number
}

export interface Pomodoro {
  id: number
  completed: boolean
  duration_minutes: number
  user_id: number
  created_at: string
}

export interface Note {
  id: number
  title: string
  content?: string
  user_id: number
  created_at: string
  updated_at?: string
}

export interface User {
  id: number
  email: string
  name?: string
  created_at: string
}

export interface AIInsights {
  summary: string
  focus_area: string
  daily_tip: string
}

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name?: string) => {
    const response = await api.post('/users/register', { email, password, name })
    return response.data
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/users/login', { email, password })
    return response.data
  },
  googleSignIn: async (token: string) => {
    const response = await api.post('/users/google-signin', { token })
    return response.data
  },
  getCurrentUser: async () => {
    const response = await api.get('/users/me')
    return response.data
  },
}

// Tasks API
export const tasksAPI = {
  getAll: async (): Promise<Task[]> => {
    const response = await api.get('/tasks/')
    return response.data
  },
  getById: async (id: number): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`)
    return response.data
  },
  create: async (task: Partial<Task>): Promise<Task> => {
    const response = await api.post('/tasks/', task)
    return response.data
  },
  update: async (id: number, task: Partial<Task>): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, task)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`)
  },
  reorder: async (taskIds: number[]): Promise<void> => {
    await api.post('/tasks/reorder', taskIds)
  },
}

// Pomodoro API
export const pomodoroAPI = {
  getAll: async (): Promise<Pomodoro[]> => {
    const response = await api.get('/pomodoro/')
    return response.data
  },
  getById: async (id: number): Promise<Pomodoro> => {
    const response = await api.get(`/pomodoro/${id}`)
    return response.data
  },
  create: async (pomodoro: Partial<Pomodoro>): Promise<Pomodoro> => {
    const response = await api.post('/pomodoro/', pomodoro)
    return response.data
  },
  update: async (id: number, pomodoro: Partial<Pomodoro>): Promise<Pomodoro> => {
    const response = await api.put(`/pomodoro/${id}`, pomodoro)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/pomodoro/${id}`)
  },
}

// Notes API
export const notesAPI = {
  getAll: async (): Promise<Note[]> => {
    const response = await api.get('/notes/')
    return response.data
  },
  getById: async (id: number): Promise<Note> => {
    const response = await api.get(`/notes/${id}`)
    return response.data
  },
  create: async (note: Partial<Note>): Promise<Note> => {
    const response = await api.post('/notes/', note)
    return response.data
  },
  update: async (id: number, note: Partial<Note>): Promise<Note> => {
    const response = await api.put(`/notes/${id}`, note)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/notes/${id}`)
  },
}

// AI API
export const aiAPI = {
  getInsights: async (): Promise<AIInsights> => {
    const response = await api.get('/ai/insights')
    return response.data
  },
}

// Advanced Features Interfaces
export interface UserSettings {
  id: number
  user_id: number
  preferred_study_times?: string[]
  preferred_study_days?: string[]
  focus_habits?: Record<string, any>
  study_duration_preference?: number
  survey_responses?: Record<string, any>
  created_at: string
  updated_at?: string
}

export interface Class {
  id: number
  user_id: number
  name: string
  subject?: string
  instructor?: string
  syllabus_content?: string
  schedule?: Record<string, any>
  created_at: string
  updated_at?: string
}

export interface Question {
  question: string
  options: string[]
  correct_answer: number
  explanation?: string
}

export interface Quiz {
  id: number
  user_id: number
  class_id?: number
  title: string
  description?: string
  questions: Question[]
  created_at: string
  updated_at?: string
}

export interface StudySchedule {
  id: number
  user_id: number
  class_id?: number
  subject: string
  recommended_time: string
  duration_minutes: number
  priority: string
  reasoning?: string
  created_at: string
}

export interface Analytics {
  total_study_hours: number
  average_session_length: number
  most_productive_days: string[]
  most_productive_times: string[]
  subject_breakdown: Record<string, number>
  completion_rate: number
  recommendations: string[]
}

// Settings API
export const settingsAPI = {
  get: async (): Promise<UserSettings> => {
    const response = await api.get('/settings/')
    return response.data
  },
  create: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await api.post('/settings/', settings)
    return response.data
  },
  update: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await api.put('/settings/', settings)
    return response.data
  },
}

// Classes API
export const classesAPI = {
  getAll: async (): Promise<Class[]> => {
    const response = await api.get('/classes/')
    return response.data
  },
  getById: async (id: number): Promise<Class> => {
    const response = await api.get(`/classes/${id}`)
    return response.data
  },
  create: async (classData: Partial<Class>): Promise<Class> => {
    const response = await api.post('/classes/', classData)
    return response.data
  },
  update: async (id: number, classData: Partial<Class>): Promise<Class> => {
    const response = await api.put(`/classes/${id}`, classData)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/classes/${id}`)
  },
}

// Quizzes API
export const quizzesAPI = {
  getAll: async (classId?: number): Promise<Quiz[]> => {
    const params = classId ? { class_id: classId } : {}
    const response = await api.get('/quizzes/', { params })
    return response.data
  },
  getById: async (id: number): Promise<Quiz> => {
    const response = await api.get(`/quizzes/${id}`)
    return response.data
  },
  create: async (quiz: Partial<Quiz>): Promise<Quiz> => {
    const response = await api.post('/quizzes/', quiz)
    return response.data
  },
  generate: async (classId: number, numQuestions: number = 5): Promise<Quiz> => {
    const response = await api.post('/quizzes/generate', null, {
      params: { class_id: classId, num_questions: numQuestions },
    })
    return response.data
  },
  update: async (id: number, quiz: Partial<Quiz>): Promise<Quiz> => {
    const response = await api.put(`/quizzes/${id}`, quiz)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/quizzes/${id}`)
  },
}

// Schedule API
export const scheduleAPI = {
  getRecommendations: async (): Promise<StudySchedule[]> => {
    const response = await api.get('/schedule/recommendations')
    return response.data
  },
  getAll: async (): Promise<StudySchedule[]> => {
    const response = await api.get('/schedule/')
    return response.data
  },
  create: async (schedule: Partial<StudySchedule>): Promise<StudySchedule> => {
    const response = await api.post('/schedule/', schedule)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/schedule/${id}`)
  },
}

// Analytics API
export const analyticsAPI = {
  get: async (): Promise<Analytics> => {
    const response = await api.get('/analytics/')
    return response.data
  },
}

