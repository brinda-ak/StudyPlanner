'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useTaskStore } from '@/store/taskStore'
import { Task, Pomodoro, Note, aiAPI, pomodoroAPI, notesAPI, AIInsights, analyticsAPI, Analytics } from '@/lib/api'
import Layout from '@/components/Layout'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { tasks, fetchTasks } = useTaskStore()
  const [pomodoros, setPomodoros] = useState<Pomodoro[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [insights, setInsights] = useState<AIInsights | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [insightsLoading, setInsightsLoading] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }

    const loadData = async () => {
      try {
        await fetchTasks()
        const [pomodoroData, notesData, insightsData, analyticsData] = await Promise.all([
          pomodoroAPI.getAll(),
          notesAPI.getAll(),
          aiAPI.getInsights(),
          analyticsAPI.get().catch(() => null),
        ])
        setPomodoros(pomodoroData)
        setNotes(notesData)
        setInsights(insightsData)
        setAnalytics(analyticsData)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated, router, fetchTasks])

  const refreshInsights = async () => {
    setInsightsLoading(true)
    try {
      const insightsData = await aiAPI.getInsights()
      setInsights(insightsData)
    } catch (error) {
      console.error('Failed to refresh insights:', error)
    } finally {
      setInsightsLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-text-secondary">Loading...</div>
        </div>
      </Layout>
    )
  }

  const activeTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.filter((t) => t.completed)
  const completedPomodoros = pomodoros.filter((p) => p.completed)
  const totalFocusMinutes = completedPomodoros.reduce((sum, p) => sum + p.duration_minutes, 0)

  // Calculate study streak (consecutive days with at least one completed pomodoro)
  const calculateStreak = () => {
    if (completedPomodoros.length === 0) return 0
    const dates = completedPomodoros
      .map((p) => new Date(p.created_at).toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort()
      .reverse()

    let streak = 0
    const today = new Date().toDateString()
    let currentDate = new Date()

    for (const dateStr of dates) {
      const checkDate = new Date(currentDate).toDateString()
      if (dateStr === checkDate) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }

  const streak = calculateStreak()

  // Prepare chart data for completed tasks (last 7 days)
  const taskChartData = []
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toDateString()
  })

  last7Days.forEach((dateStr) => {
    const date = new Date(dateStr)
    const tasksOnDate = completedTasks.filter(
      (t) => t.updated_at && new Date(t.updated_at).toDateString() === dateStr
    ).length
    taskChartData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tasks: tasksOnDate,
    })
  })

  // Prepare chart data for Pomodoro sessions (last 7 days)
  const pomodoroChartData = []
  last7Days.forEach((dateStr) => {
    const date = new Date(dateStr)
    const pomodorosOnDate = completedPomodoros.filter(
      (p) => p.created_at && new Date(p.created_at).toDateString() === dateStr
    ).length
    pomodoroChartData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: pomodorosOnDate,
    })
  })

  const recentTasks = tasks
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  const recentNotes = notes
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 5)

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-text-secondary text-sm font-medium mb-1">Active Tasks</div>
            <div className="text-3xl font-bold text-text">{activeTasks.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-text-secondary text-sm font-medium mb-1">Completed Tasks</div>
            <div className="text-3xl font-bold text-text">{completedTasks.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-text-secondary text-sm font-medium mb-1">Focus Minutes</div>
            <div className="text-3xl font-bold text-text">{totalFocusMinutes}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-text-secondary text-sm font-medium mb-1">Study Streak</div>
            <div className="text-3xl font-bold text-text">{streak} days</div>
          </div>
        </div>

        {/* AI Insights */}
        {insights && (
          <div className="bg-accent rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-text">AI Study Insights</h2>
              <button
                onClick={refreshInsights}
                disabled={insightsLoading}
                className="px-4 py-2 bg-white hover:bg-gray-50 text-text text-sm font-medium rounded-md transition-colors disabled:opacity-50"
              >
                {insightsLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-text-secondary mb-1">Summary</div>
                <div className="text-text">{insights.summary}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-text-secondary mb-1">Focus Area</div>
                <div className="inline-block px-3 py-1 bg-white rounded-full text-text font-medium">
                  {insights.focus_area}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-text-secondary mb-1">Daily Tip</div>
                <div className="text-text">{insights.daily_tip}</div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-text mb-4">Completed Tasks (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={taskChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="#FFF9C4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-text mb-4">Pomodoro Sessions (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={pomodoroChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sessions" stroke="#FFF9C4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Tasks and Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text">Recent Tasks</h3>
              <Link
                href="/tasks"
                className="text-sm text-text-secondary hover:text-text transition-colors"
              >
                View all
              </Link>
            </div>
            {recentTasks.length > 0 ? (
              <ul className="space-y-2">
                {recentTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className={`font-medium ${task.completed ? 'line-through text-text-secondary' : 'text-text'}`}>
                        {task.title}
                      </div>
                      {task.due_date && (
                        <div className="text-sm text-text-secondary">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        task.priority === 'High'
                          ? 'bg-red-100 text-red-700'
                          : task.priority === 'Medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-text-secondary text-center py-8">
                No tasks yet. <Link href="/tasks" className="text-text hover:underline">Create one</Link>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text">Recent Notes</h3>
              <Link
                href="/notes"
                className="text-sm text-text-secondary hover:text-text transition-colors"
              >
                View all
              </Link>
            </div>
            {recentNotes.length > 0 ? (
              <ul className="space-y-2">
                {recentNotes.map((note) => (
                  <li
                    key={note.id}
                    className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <Link href={`/notes`}>
                      <div className="font-medium text-text">{note.title}</div>
                      {note.content && (
                        <div className="text-sm text-text-secondary mt-1 line-clamp-2">
                          {note.content.substring(0, 100)}
                          {note.content.length > 100 ? '...' : ''}
                        </div>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-text-secondary text-center py-8">
                No notes yet. <Link href="/notes" className="text-text hover:underline">Create one</Link>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Section */}
        {analytics && (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-text mb-4">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-text-secondary text-sm font-medium mb-1">Total Study Hours</div>
                <div className="text-2xl font-bold text-text">{analytics.total_study_hours}h</div>
              </div>
              <div>
                <div className="text-text-secondary text-sm font-medium mb-1">Avg Session Length</div>
                <div className="text-2xl font-bold text-text">{analytics.average_session_length} min</div>
              </div>
              <div>
                <div className="text-text-secondary text-sm font-medium mb-1">Completion Rate</div>
                <div className="text-2xl font-bold text-text">{analytics.completion_rate}%</div>
              </div>
              <div>
                <div className="text-text-secondary text-sm font-medium mb-1">Most Productive Day</div>
                <div className="text-xl font-bold text-text">
                  {analytics.most_productive_days[0] || 'N/A'}
                </div>
              </div>
            </div>

            {analytics.recommendations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-text mb-2">Recommendations</h3>
                <ul className="list-disc list-inside space-y-1 text-text-secondary">
                  {analytics.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

