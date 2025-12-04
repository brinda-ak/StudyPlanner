'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Note, notesAPI } from '@/lib/api'
import Layout from '@/components/Layout'

export default function NotesPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  })
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadNotes()
  }, [isAuthenticated, router])

  const loadNotes = async () => {
    try {
      const data = await notesAPI.getAll()
      setNotes(data)
    } catch (error) {
      console.error('Failed to load notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingNote) {
        await notesAPI.update(editingNote.id, formData)
      } else {
        await notesAPI.create(formData)
      }
      await loadNotes()
      resetForm()
      setShowModal(false)
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
    })
    setEditingNote(null)
  }

  const handleEdit = (note: Note) => {
    setEditingNote(note)
    setFormData({
      title: note.title,
      content: note.content || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await notesAPI.delete(id)
        await loadNotes()
        if (selectedNote?.id === id) {
          setSelectedNote(null)
        }
      } catch (error) {
        console.error('Failed to delete note:', error)
      }
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
      <div className="flex h-[calc(100vh-8rem)] gap-6">
        {/* Notes List */}
        <div className="w-1/3 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-text">Notes</h1>
            <button
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-text font-semibold rounded-md transition-colors text-sm"
            >
              New Note
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {notes.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {notes
                  .sort(
                    (a, b) =>
                      new Date(b.updated_at || b.created_at).getTime() -
                      new Date(a.updated_at || a.created_at).getTime()
                  )
                  .map((note) => (
                    <li
                      key={note.id}
                      onClick={() => setSelectedNote(note)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedNote?.id === note.id ? 'bg-accent' : ''
                      }`}
                    >
                      <h3 className="font-semibold text-text mb-1">{note.title}</h3>
                      {note.content && (
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {note.content.substring(0, 100)}
                          {note.content.length > 100 ? '...' : ''}
                        </p>
                      )}
                      <div className="text-xs text-text-secondary mt-2">
                        {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                      </div>
                    </li>
                  ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-text-secondary">
                No notes yet. Create your first note!
              </div>
            )}
          </div>
        </div>

        {/* Note Detail */}
        <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          {selectedNote ? (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-text">{selectedNote.title}</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(selectedNote)}
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
                    onClick={() => handleDelete(selectedNote.id)}
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
              <div className="text-sm text-text-secondary mb-4">
                Created: {new Date(selectedNote.created_at).toLocaleString()}
                {selectedNote.updated_at && selectedNote.updated_at !== selectedNote.created_at && (
                  <span> | Updated: {new Date(selectedNote.updated_at).toLocaleString()}</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="text-text whitespace-pre-wrap">{selectedNote.content || 'No content'}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary">
              Select a note to view its content
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-text mb-4">
              {editingNote ? 'Edit Note' : 'New Note'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-text mb-1">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
                />
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-text mb-1">
                  Content
                </label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accent hover:bg-accent/90 text-text font-semibold rounded-md transition-colors"
                >
                  {editingNote ? 'Update' : 'Create'}
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
    </Layout>
  )
}

