'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { settingsAPI, UserSettings } from '@/lib/api'
import Layout from '@/components/Layout'

export default function SettingsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    preferred_study_times: [],
    preferred_study_days: [],
    focus_habits: {},
    study_duration_preference: 60,
    survey_responses: {},
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadSettings()
  }, [isAuthenticated, router])

  const loadSettings = async () => {
    try {
      const data = await settingsAPI.get()
      setSettings({
        preferred_study_times: data.preferred_study_times || [],
        preferred_study_days: data.preferred_study_days || [],
        focus_habits: data.focus_habits || {},
        study_duration_preference: data.study_duration_preference || 60,
        survey_responses: data.survey_responses || {},
      })
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingsAPI.update(settings)
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const timeSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
    '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM',
    '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM',
  ]

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const toggleTime = (time: string) => {
    const times = settings.preferred_study_times || []
    if (times.includes(time)) {
      setSettings({ ...settings, preferred_study_times: times.filter((t) => t !== time) })
    } else {
      setSettings({ ...settings, preferred_study_times: [...times, time] })
    }
  }

  const toggleDay = (day: string) => {
    const days = settings.preferred_study_days || []
    if (days.includes(day)) {
      setSettings({ ...settings, preferred_study_days: days.filter((d) => d !== day) })
    } else {
      setSettings({ ...settings, preferred_study_days: [...days, day] })
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text">Settings & Survey</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-text font-semibold rounded-md transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Study Preferences */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-text mb-4">Study Preferences</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Preferred Study Times
              </label>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => toggleTime(time)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      settings.preferred_study_times?.includes(time)
                        ? 'bg-accent text-text'
                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Preferred Study Days
              </label>
              <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      settings.preferred_study_days?.includes(day)
                        ? 'bg-accent text-text'
                        : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-text mb-2">
                Preferred Study Duration (minutes)
              </label>
              <input
                id="duration"
                type="number"
                min="15"
                max="120"
                step="15"
                value={settings.study_duration_preference || 60}
                onChange={(e) =>
                  setSettings({ ...settings, study_duration_preference: parseInt(e.target.value) })
                }
                className="w-full md:w-48 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
              />
            </div>
          </div>
        </div>

        {/* Quick Survey */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-text mb-4">Quick Survey</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                What is your primary study goal?
              </label>
              <select
                value={(settings.survey_responses?.primary_goal as string) || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    survey_responses: {
                      ...settings.survey_responses,
                      primary_goal: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
              >
                <option value="">Select...</option>
                <option value="academic_excellence">Academic Excellence</option>
                <option value="time_management">Better Time Management</option>
                <option value="exam_preparation">Exam Preparation</option>
                <option value="skill_development">Skill Development</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                How many hours do you study per day?
              </label>
              <select
                value={(settings.survey_responses?.daily_hours as string) || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    survey_responses: {
                      ...settings.survey_responses,
                      daily_hours: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
              >
                <option value="">Select...</option>
                <option value="1-2">1-2 hours</option>
                <option value="2-4">2-4 hours</option>
                <option value="4-6">4-6 hours</option>
                <option value="6+">6+ hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                What distracts you most while studying?
              </label>
              <select
                value={(settings.survey_responses?.distractions as string) || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    survey_responses: {
                      ...settings.survey_responses,
                      distractions: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
              >
                <option value="">Select...</option>
                <option value="phone">Phone/Notifications</option>
                <option value="social_media">Social Media</option>
                <option value="noise">Noise/Environment</option>
                <option value="fatigue">Fatigue</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                What study technique works best for you?
              </label>
              <select
                value={(settings.survey_responses?.study_technique as string) || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    survey_responses: {
                      ...settings.survey_responses,
                      study_technique: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
              >
                <option value="">Select...</option>
                <option value="pomodoro">Pomodoro Technique</option>
                <option value="spaced_repetition">Spaced Repetition</option>
                <option value="active_recall">Active Recall</option>
                <option value="note_taking">Note Taking</option>
                <option value="mixed">Mixed Approach</option>
              </select>
            </div>
          </div>
        </div>

        {/* Focus Habits */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-text mb-4">Focus Habits</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Preferred study environment
              </label>
              <textarea
                value={(settings.focus_habits?.environment as string) || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    focus_habits: {
                      ...settings.focus_habits,
                      environment: e.target.value,
                    },
                  })
                }
                rows={3}
                placeholder="e.g., Quiet library, coffee shop, home desk..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Study strategies that work for you
              </label>
              <textarea
                value={(settings.focus_habits?.strategies as string) || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    focus_habits: {
                      ...settings.focus_habits,
                      strategies: e.target.value,
                    },
                  })
                }
                rows={3}
                placeholder="e.g., Break down topics into smaller chunks, use flashcards..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

