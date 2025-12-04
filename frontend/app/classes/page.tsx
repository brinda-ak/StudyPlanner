'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { classesAPI, Class, quizzesAPI, tasksAPI } from '@/lib/api'
import Layout from '@/components/Layout'

export default function ClassesPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    instructor: '',
    syllabus_content: '',
    schedule: '',
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadClasses()
  }, [isAuthenticated, router])

  const loadClasses = async () => {
    try {
      const data = await classesAPI.getAll()
      setClasses(data)
    } catch (error) {
      console.error('Failed to load classes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const classData = {
        name: formData.name,
        subject: formData.subject || undefined,
        instructor: formData.instructor || undefined,
        syllabus_content: formData.syllabus_content || undefined,
        schedule: formData.schedule ? JSON.parse(formData.schedule) : undefined,
      }

      if (editingClass) {
        await classesAPI.update(editingClass.id, classData)
      } else {
        await classesAPI.create(classData)
      }
      await loadClasses()
      resetForm()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save class:', error)
      alert('Failed to save class')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      instructor: '',
      syllabus_content: '',
      schedule: '',
    })
    setEditingClass(null)
  }

  const handleEdit = (cls: Class) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      subject: cls.subject || '',
      instructor: cls.instructor || '',
      syllabus_content: cls.syllabus_content || '',
      schedule: cls.schedule ? JSON.stringify(cls.schedule, null, 2) : '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this class? This will also delete associated quizzes and schedules.')) {
      try {
        await classesAPI.delete(id)
        await loadClasses()
      } catch (error) {
        console.error('Failed to delete class:', error)
        alert('Failed to delete class')
      }
    }
  }

  const handleGenerateTasks = async (cls: Class) => {
    if (!cls.syllabus_content) {
      alert('Please add syllabus content first to generate tasks')
      return
    }

    try {
      // This would call an AI endpoint to generate tasks from syllabus
      // For now, create a placeholder task
      await tasksAPI.create({
        title: `Study ${cls.name}`,
        description: `Review syllabus and prepare for ${cls.name}`,
        category: cls.subject || cls.name,
        priority: 'High',
      })
      alert('Task created! Check your Tasks page.')
    } catch (error) {
      console.error('Failed to generate tasks:', error)
      alert('Failed to generate tasks')
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
          <h1 className="text-3xl font-bold text-text">Classes</h1>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-text font-semibold rounded-md transition-colors"
          >
            Add Class
          </button>
        </div>

        {classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-text mb-1">{cls.name}</h3>
                    {cls.subject && <p className="text-sm text-text-secondary mb-1">Subject: {cls.subject}</p>}
                    {cls.instructor && <p className="text-sm text-text-secondary">Instructor: {cls.instructor}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(cls)}
                      className="p-2 text-text-secondary hover:text-text transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(cls.id)}
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

                {cls.syllabus_content && (
                  <div className="mb-4">
                    <p className="text-sm text-text-secondary line-clamp-3">
                      {cls.syllabus_content.substring(0, 150)}
                      {cls.syllabus_content.length > 150 ? '...' : ''}
                    </p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => router.push(`/quizzes?classId=${cls.id}`)}
                    className="flex-1 px-3 py-2 bg-accent hover:bg-accent/90 text-text text-sm font-medium rounded-md transition-colors"
                  >
                    View Quizzes
                  </button>
                  <button
                    onClick={() => handleGenerateTasks(cls)}
                    className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-text text-sm font-medium rounded-md transition-colors"
                  >
                    Generate Tasks
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
            <p className="text-text-secondary mb-4">No classes yet. Add your first class to get started!</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-semibold text-text mb-4">
                {editingClass ? 'Edit Class' : 'Add Class'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text mb-1">
                    Class Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-text mb-1">
                      Subject
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
                    />
                  </div>
                  <div>
                    <label htmlFor="instructor" className="block text-sm font-medium text-text mb-1">
                      Instructor
                    </label>
                    <input
                      id="instructor"
                      type="text"
                      value={formData.instructor}
                      onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="syllabus_content" className="block text-sm font-medium text-text mb-1">
                    Syllabus Content
                  </label>
                  <textarea
                    id="syllabus_content"
                    value={formData.syllabus_content}
                    onChange={(e) => setFormData({ ...formData, syllabus_content: e.target.value })}
                    rows={8}
                    placeholder="Paste or type your class syllabus here..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    This will be used to generate quizzes and study recommendations
                  </p>
                </div>
                <div>
                  <label htmlFor="schedule" className="block text-sm font-medium text-text mb-1">
                    Schedule (JSON format, optional)
                  </label>
                  <textarea
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    rows={4}
                    placeholder='{"days": ["Monday", "Wednesday"], "time": "10:00 AM", "location": "Room 101"}'
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text font-mono text-sm"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-accent hover:bg-accent/90 text-text font-semibold rounded-md transition-colors"
                  >
                    {editingClass ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-text font-semibold rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

