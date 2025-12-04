'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { usePomodoroStore } from '@/store/pomodoroStore'
import { Pomodoro, pomodoroAPI } from '@/lib/api'
import Layout from '@/components/Layout'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PomodoroPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [pomodoros, setPomodoros] = useState<Pomodoro[]>([])
  const [loading, setLoading] = useState(true)
  const [currentSession, setCurrentSession] = useState<Pomodoro | null>(null)
  
  // Use store for timer state
  const {
    duration,
    breakDuration,
    isRunning,
    isBreak,
    completedSessionsCount,
    currentSessionId,
    setDuration: setStoreDuration,
    setBreakDuration: setStoreBreakDuration,
    startTimer: startStoreTimer,
    startBreak: startStoreBreak,
    pauseTimer: pauseStoreTimer,
    resumeTimer: resumeStoreTimer,
    stopTimer: stopStoreTimer,
    completeTimer: completeStoreTimer,
    skipBreak: skipStoreBreak,
    getRemainingTime,
  } = usePomodoroStore()
  
  // Initialize display timers from store values
  const [displayTimer, setDisplayTimer] = useState(() => duration * 60)
  const [displayBreakTimer, setDisplayBreakTimer] = useState(() => breakDuration * 60)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadPomodoros()
    
    // Initialize display timer from duration when not running
    if (!isRunning && !currentSession && !isBreak) {
      setDisplayTimer(duration * 60)
    } else {
      // Sync display timer from store on mount - this handles background timer
      const remaining = getRemainingTime()
      if (isBreak) {
        setDisplayBreakTimer(remaining > 0 ? remaining : breakDuration * 60)
      } else if (isRunning) {
        setDisplayTimer(remaining)
        // If we have a session ID but no currentSession, try to restore it
        if (currentSessionId && !currentSession) {
          pomodoroAPI.getById(currentSessionId).then(setCurrentSession).catch(() => {
            // Session might not exist anymore, clear it
            stopStoreTimer()
          })
        }
      } else {
        setDisplayTimer(duration * 60)
      }
    }
  }, [isAuthenticated, router])

  // Sync display timer from store
  const syncDisplayTimer = () => {
    if (isBreak) {
      const remaining = getRemainingTime()
      setDisplayBreakTimer(remaining)
    } else {
      // When not running and no session, always show duration
      if (!isRunning && !currentSession) {
        setDisplayTimer(duration * 60)
      } else {
        const remaining = getRemainingTime()
        setDisplayTimer(remaining)
      }
    }
  }

  // Update display timer every second when running
  useEffect(() => {
    // Initialize: if not running, show duration
    if (!isRunning && !currentSession && !isBreak) {
      setDisplayTimer(duration * 60)
    } else {
      syncDisplayTimer() // Initial sync
    }
    
    const interval = setInterval(() => {
      // Only update when timer is running
      if (!isRunning && !currentSession && !isBreak) {
        // Not running - show duration setting
        setDisplayTimer(duration * 60)
        return
      }
      
      const remaining = getRemainingTime()
      
      if (isBreak) {
        setDisplayBreakTimer(remaining)
        if (remaining <= 0 && isRunning) {
          handleBreakComplete()
        }
      } else {
        setDisplayTimer(remaining)
        if (remaining <= 0 && isRunning && currentSession) {
          handleComplete()
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, isBreak, currentSession, duration, breakDuration, getRemainingTime])

  // Update display timer when duration changes (when not running)
  useEffect(() => {
    if (!isRunning && !currentSession && !isBreak) {
      setDisplayTimer(duration * 60)
    }
  }, [duration, isRunning, currentSession, isBreak])

  // Update display break timer when break duration changes (when not running)
  useEffect(() => {
    if (!isRunning && !isBreak) {
      setDisplayBreakTimer(breakDuration * 60)
    }
  }, [breakDuration, isRunning, isBreak])

  const loadPomodoros = async () => {
    try {
      const data = await pomodoroAPI.getAll()
      setPomodoros(data)
    } catch (error) {
      console.error('Failed to load pomodoros:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStart = async () => {
    try {
      const newSession = await pomodoroAPI.create({
        completed: false,
        duration_minutes: duration,
      })
      setCurrentSession(newSession)
      const durationSeconds = duration * 60
      startStoreTimer(newSession.id, durationSeconds)
      setDisplayTimer(durationSeconds)
    } catch (error) {
      console.error('Failed to create pomodoro session:', error)
    }
  }

  const handlePause = () => {
    pauseStoreTimer()
  }

  const handleResume = () => {
    resumeStoreTimer()
  }

  const handleStop = async () => {
    if (currentSession) {
      try {
        await pomodoroAPI.update(currentSession.id, { completed: false })
      } catch (error) {
        console.error('Failed to update pomodoro:', error)
      }
    }
    setCurrentSession(null)
    stopStoreTimer()
    setDisplayTimer(duration * 60)
    setDisplayBreakTimer(breakDuration * 60)
  }

  const handleComplete = async () => {
    if (currentSession) {
      try {
        await pomodoroAPI.update(currentSession.id, { completed: true })
        await loadPomodoros()
        
        const currentCount = completedSessionsCount
        completeStoreTimer()
        const newCount = currentCount + 1
        
        // Automatically start break
        const longBreak = newCount > 0 && newCount % 4 === 0
        const breakTime = longBreak ? 15 : breakDuration
        setCurrentSession(null)
        setDisplayTimer(duration * 60)
        
        // Small delay before starting break
        setTimeout(() => {
          startStoreBreak(breakTime * 60)
          setDisplayBreakTimer(breakTime * 60)
        }, 500)
      } catch (error) {
        console.error('Failed to complete pomodoro:', error)
        setCurrentSession(null)
        stopStoreTimer()
        setDisplayTimer(duration * 60)
      }
    }
  }

  const handleBreakComplete = () => {
    stopStoreTimer()
    setDisplayBreakTimer(breakDuration * 60)
  }

  const handleSkipBreak = () => {
    skipStoreBreak()
    setDisplayBreakTimer(breakDuration * 60)
  }

  const handleStartBreak = () => {
    const longBreak = completedSessionsCount > 0 && completedSessionsCount % 4 === 0
    const breakTime = longBreak ? 15 : breakDuration
    startStoreBreak(breakTime * 60)
    setDisplayBreakTimer(breakTime * 60)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this session?')) {
      try {
        await pomodoroAPI.delete(id)
        await loadPomodoros()
      } catch (error) {
        console.error('Failed to delete pomodoro:', error)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate progress percentage (0 = empty, 100 = full)
  const getProgress = () => {
    const remaining = getRemainingTime()
    if (isBreak) {
      const totalBreakSeconds = breakDuration * 60
      if (totalBreakSeconds === 0) return 0
      const elapsed = totalBreakSeconds - remaining
      const progressPercent = (elapsed / totalBreakSeconds) * 100
      return Math.min(100, Math.max(0, progressPercent))
    } else {
      const totalSeconds = duration * 60
      if (totalSeconds === 0) return 0
      const elapsed = totalSeconds - remaining
      const progressPercent = (elapsed / totalSeconds) * 100
      return Math.min(100, Math.max(0, progressPercent))
    }
  }

  const progress = getProgress()
  
  // Calculate circumference and stroke-dashoffset for the ring
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const completedPomodoros = pomodoros.filter((p) => p.completed)
  const totalFocusMinutes = completedPomodoros.reduce((sum, p) => sum + p.duration_minutes, 0)

  // Prepare chart data for last 7 days
  const chartData: Array<{ date: string; sessions: number; minutes: number }> = []
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toDateString()
  })

  last7Days.forEach((dateStr) => {
    const date = new Date(dateStr)
    const pomodorosOnDate = completedPomodoros.filter(
      (p) => p.created_at && new Date(p.created_at).toDateString() === dateStr
    )
    const focusMinutes = pomodorosOnDate.reduce((sum, p) => sum + p.duration_minutes, 0)
    chartData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: pomodorosOnDate.length,
      minutes: focusMinutes,
    })
  })

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
        <h1 className="text-3xl font-bold text-text">Pomodoro Timer</h1>

        {/* Timer Section */}
        <div className={`bg-white rounded-lg shadow-md p-8 border-2 ${
          isBreak ? 'border-green-400 bg-green-50' : 'border-gray-200'
        }`}>
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              {/* Circular Progress Ring */}
              <div className="relative inline-block mb-4">
                <svg className="transform -rotate-90" width="220" height="220">
                  {/* Background ring */}
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    stroke={isBreak ? "#e5e7eb" : "#e5e7eb"}
                    strokeWidth="12"
                    fill="none"
                  />
                  {/* Progress ring */}
                  <circle
                    cx="110"
                    cy="110"
                    r={radius}
                    stroke={isBreak ? "#4ade80" : "#FFF9C4"}
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                {/* Timer text in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {isBreak ? (
                    <>
                      <div className="text-sm font-semibold text-green-600 mb-1">
                        {completedSessionsCount > 0 && (completedSessionsCount) % 4 === 0 
                          ? 'Long Break' 
                          : 'Break'}
                      </div>
                      <div className="text-4xl font-bold text-green-600">{formatTime(displayBreakTimer)}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-semibold text-text mb-1">Focus</div>
                      <div className="text-4xl font-bold text-text">{formatTime(displayTimer)}</div>
                    </>
                  )}
                </div>
              </div>
              
              {!currentSession && !isBreak && ( 
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <label htmlFor="duration" className="text-text-secondary">
                      Work Duration (minutes):
                    </label>
                    <input
                      id="duration"
                      type="number"
                      min="1"
                      max="60"
                        value={duration}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 25
                          setStoreDuration(val)
                          // Always update display when duration changes (when not running)
                          if (!isRunning && !currentSession && !isBreak) {
                            setDisplayTimer(val * 60)
                          }
                        }}
                      className="w-20 px-3 py-1 border border-gray-300 rounded-md text-text text-center"
                      disabled={isRunning || currentSession !== null}
                    />
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <label htmlFor="breakDuration" className="text-text-secondary">
                      Break Duration (minutes):
                    </label>
                    <input
                      id="breakDuration"
                      type="number"
                      min="1"
                      max="30"
                        value={breakDuration}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 5
                          setStoreBreakDuration(val)
                          setDisplayBreakTimer(val * 60)
                        }}
                      className="w-20 px-3 py-1 border border-gray-300 rounded-md text-text text-center"
                      disabled={isRunning || currentSession !== null}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-center space-x-4">
              {!currentSession && !isRunning && !isBreak && (
                <button
                  onClick={handleStart}
                  className="px-6 py-3 bg-accent hover:bg-accent/90 text-text font-semibold rounded-md transition-colors"
                >
                  Start Focus
                </button>
              )}
              {isBreak && !isRunning && (
                <button
                  onClick={handleStartBreak}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md transition-colors"
                >
                  Start Break
                </button>
              )}
              {((currentSession && isRunning) || (isBreak && isRunning)) && (
                <button
                  onClick={handlePause}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-md transition-colors"
                >
                  Pause
                </button>
              )}
              {((currentSession && !isRunning && displayTimer > 0) || (isBreak && !isRunning && displayBreakTimer > 0)) && (
                <button
                  onClick={handleResume}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-md transition-colors"
                >
                  Resume
                </button>
              )}
              {isBreak && (
                <button
                  onClick={handleSkipBreak}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-md transition-colors"
                >
                  Skip Break
                </button>
              )}
              {(currentSession || isBreak) && (
                <button
                  onClick={handleStop}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md transition-colors"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-text-secondary text-sm font-medium mb-1">Total Sessions</div>
            <div className="text-3xl font-bold text-text">{completedPomodoros.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-text-secondary text-sm font-medium mb-1">Total Focus Time</div>
            <div className="text-3xl font-bold text-text">{totalFocusMinutes} min</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="text-text-secondary text-sm font-medium mb-1">Average Session</div>
            <div className="text-3xl font-bold text-text">
              {completedPomodoros.length > 0
                ? Math.round(totalFocusMinutes / completedPomodoros.length)
                : 0}{' '}
              min
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-text mb-4">Sessions (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sessions" fill="#FFF9C4" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-text mb-4">Focus Time (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="minutes" stroke="#FFF9C4" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Session History */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-text mb-4">Session History</h2>
          {pomodoros.length > 0 ? (
            <div className="space-y-2">
              {pomodoros
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((pomodoro) => (
                  <div
                    key={pomodoro.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          pomodoro.completed ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      <div>
                        <div className="font-medium text-text">
                          {pomodoro.duration_minutes} minutes
                        </div>
                        <div className="text-sm text-text-secondary">
                          {new Date(pomodoro.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(pomodoro.id)}
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
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">No sessions yet. Start your first Pomodoro!</div>
          )}
        </div>
      </div>
    </Layout>
  )
}

