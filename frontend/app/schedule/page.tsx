'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { scheduleAPI, classesAPI, StudySchedule, Class } from '@/lib/api'
import Layout from '@/components/Layout'

export default function SchedulePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [schedules, setSchedules] = useState<StudySchedule[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadData()
  }, [isAuthenticated, router])

  const loadData = async () => {
    try {
      const [schedulesData, classesData] = await Promise.all([
        scheduleAPI.getAll(),
        classesAPI.getAll(),
      ])
      setSchedules(schedulesData)
      setClasses(classesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateRecommendations = async () => {
    if (classes.length === 0) {
      alert('Please add classes first to generate schedule recommendations')
      return
    }

    setGenerating(true)
    try {
      const recommendations = await scheduleAPI.getRecommendations()
      await loadData()
      alert(`Generated ${recommendations.length} schedule recommendations!`)
    } catch (error: any) {
      console.error('Failed to generate recommendations:', error)
      alert(error.response?.data?.detail || 'Failed to generate schedule recommendations')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      try {
        await scheduleAPI.delete(id)
        await loadData()
      } catch (error) {
        console.error('Failed to delete schedule:', error)
        alert('Failed to delete schedule')
      }
    }
  }

  const handleCreateTask = async (schedule: StudySchedule) => {
    try {
      // This would create a task from the schedule
      router.push(`/tasks?createFromSchedule=${schedule.id}`)
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  // Group schedules by date
  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const date = new Date(schedule.recommended_time).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(schedule)
    return acc
  }, {} as Record<string, StudySchedule[]>)

  const sortedDates = Object.keys(groupedSchedules).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  )

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-text-secondary">Loading...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text">Study Schedule</h1>
          <button
            onClick={handleGenerateRecommendations}
            disabled={generating || classes.length === 0}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-text font-semibold rounded-md transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Recommendations'}
          </button>
        </div>

        {schedules.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
            <p className="text-text-secondary mb-4">
              No study schedules yet. Generate AI-powered recommendations based on your classes and study preferences!
            </p>
            {classes.length === 0 && (
              <p className="text-sm text-text-secondary">
                Add classes first in the Classes page to get personalized recommendations.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date} className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-text">
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h2>
                </div>
                <div className="p-4 space-y-4">
                  {groupedSchedules[date]
                    .sort(
                      (a, b) =>
                        new Date(a.recommended_time).getTime() - new Date(b.recommended_time).getTime()
                    )
                    .map((schedule) => (
                      <div
                        key={schedule.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-text mb-1">{schedule.subject}</h3>
                            <p className="text-sm text-text-secondary">
                              {new Date(schedule.recommended_time).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}{' '}
                              - {schedule.duration_minutes} minutes
                            </p>
                            {schedule.reasoning && (
                              <p className="text-sm text-text-secondary mt-2 italic">
                                {schedule.reasoning}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                schedule.priority === 'High'
                                  ? 'bg-red-100 text-red-700'
                                  : schedule.priority === 'Medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {schedule.priority}
                            </span>
                            <button
                              onClick={() => handleDelete(schedule.id)}
                              className="p-2 text-red-600 hover:text-red-700 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCreateTask(schedule)}
                          className="mt-2 px-3 py-1 bg-accent hover:bg-accent/90 text-text text-sm font-medium rounded-md transition-colors"
                        >
                          Create Task
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

