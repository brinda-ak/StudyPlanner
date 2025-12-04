'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { quizzesAPI, classesAPI, Quiz, Class, Question } from '@/lib/api'
import Layout from '@/components/Layout'

export default function QuizzesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadData()
  }, [isAuthenticated, router])

  useEffect(() => {
    const classId = searchParams.get('classId')
    if (classId) {
      setSelectedClassId(parseInt(classId))
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedClassId) {
      loadQuizzes(selectedClassId)
    } else {
      loadQuizzes()
    }
  }, [selectedClassId])

  const loadData = async () => {
    try {
      const [quizzesData, classesData] = await Promise.all([quizzesAPI.getAll(), classesAPI.getAll()])
      setQuizzes(quizzesData)
      setClasses(classesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQuizzes = async (classId?: number) => {
    try {
      const data = await quizzesAPI.getAll(classId)
      setQuizzes(data)
    } catch (error) {
      console.error('Failed to load quizzes:', error)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!selectedClassId) {
      alert('Please select a class first')
      return
    }

    setGenerating(true)
    try {
      const quiz = await quizzesAPI.generate(selectedClassId, 5)
      await loadQuizzes(selectedClassId)
      setSelectedQuiz(quiz)
      alert('Quiz generated successfully!')
    } catch (error) {
      console.error('Failed to generate quiz:', error)
      alert('Failed to generate quiz. Make sure the class has syllabus content.')
    } finally {
      setGenerating(false)
    }
  }

  const handleTakeQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz)
    setUserAnswers({})
    setShowResults(false)
  }

  const handleSubmitQuiz = () => {
    setShowResults(true)
  }

  const calculateScore = () => {
    if (!selectedQuiz) return { correct: 0, total: 0, percentage: 0 }

    let correct = 0
    selectedQuiz.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correct_answer) {
        correct++
      }
    })

    return {
      correct,
      total: selectedQuiz.questions.length,
      percentage: Math.round((correct / selectedQuiz.questions.length) * 100),
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this quiz?')) {
      try {
        await quizzesAPI.delete(id)
        await loadQuizzes(selectedClassId || undefined)
        if (selectedQuiz?.id === id) {
          setSelectedQuiz(null)
        }
      } catch (error) {
        console.error('Failed to delete quiz:', error)
        alert('Failed to delete quiz')
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

  const score = selectedQuiz && showResults ? calculateScore() : null

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-text">Quizzes</h1>
          {classes.length > 0 && (
            <button
              onClick={handleGenerateQuiz}
              disabled={generating || !selectedClassId}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-text font-semibold rounded-md transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Quiz'}
            </button>
          )}
        </div>

        {/* Class Filter */}
        {classes.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <label htmlFor="classFilter" className="block text-sm font-medium text-text mb-2">
              Filter by Class
            </label>
            <select
              id="classFilter"
              value={selectedClassId || ''}
              onChange={(e) => setSelectedClassId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-accent focus:border-transparent text-text"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {!selectedQuiz ? (
          <div>
            {quizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-text mb-1">{quiz.title}</h3>
                        {quiz.description && (
                          <p className="text-sm text-text-secondary mb-2">{quiz.description}</p>
                        )}
                        <p className="text-sm text-text-secondary">
                          {quiz.questions.length} questions
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(quiz.id)}
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
                    <button
                      onClick={() => handleTakeQuiz(quiz)}
                      className="w-full px-4 py-2 bg-accent hover:bg-accent/90 text-text font-semibold rounded-md transition-colors"
                    >
                      Take Quiz
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
                <p className="text-text-secondary mb-4">
                  {selectedClassId
                    ? 'No quizzes for this class yet. Generate one!'
                    : 'No quizzes yet. Add a class and generate quizzes from syllabus!'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-text">{selectedQuiz.title}</h2>
              <button
                onClick={() => {
                  setSelectedQuiz(null)
                  setShowResults(false)
                  setUserAnswers({})
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-text font-semibold rounded-md transition-colors"
              >
                Back to Quizzes
              </button>
            </div>

            {!showResults ? (
              <div className="space-y-6">
                {selectedQuiz.questions.map((question: Question, index: number) => (
                  <div key={index} className="border-b border-gray-200 pb-6">
                    <h3 className="text-lg font-medium text-text mb-4">
                      {index + 1}. {question.question}
                    </h3>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label
                          key={optionIndex}
                          className={`flex items-center p-3 rounded-md cursor-pointer transition-colors ${
                            userAnswers[index] === optionIndex
                              ? 'bg-accent'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${index}`}
                            value={optionIndex}
                            checked={userAnswers[index] === optionIndex}
                            onChange={() => setUserAnswers({ ...userAnswers, [index]: optionIndex })}
                            className="mr-3"
                          />
                          <span className="text-text">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleSubmitQuiz}
                  className="w-full px-4 py-2 bg-accent hover:bg-accent/90 text-text font-semibold rounded-md transition-colors"
                >
                  Submit Quiz
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-accent rounded-lg p-6 text-center">
                  <h3 className="text-2xl font-bold text-text mb-2">Your Score</h3>
                  <p className="text-4xl font-bold text-text mb-1">{score?.percentage}%</p>
                  <p className="text-text-secondary">
                    {score?.correct} out of {score?.total} correct
                  </p>
                </div>

                {selectedQuiz.questions.map((question: Question, index: number) => {
                  const isCorrect = userAnswers[index] === question.correct_answer
                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${
                        isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-medium text-text">
                          {index + 1}. {question.question}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${
                            isCorrect
                              ? 'bg-green-200 text-green-800'
                              : 'bg-red-200 text-red-800'
                          }`}
                        >
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <div className="space-y-1 mb-2">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded ${
                              optionIndex === question.correct_answer
                                ? 'bg-green-100 text-green-800 font-medium'
                                : optionIndex === userAnswers[index] && !isCorrect
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-50 text-text-secondary'
                            }`}
                          >
                            {option} {optionIndex === question.correct_answer && '(Correct Answer)'}
                            {optionIndex === userAnswers[index] && !isCorrect && ' (Your Answer)'}
                          </div>
                        ))}
                      </div>
                      {question.explanation && (
                        <p className="text-sm text-text-secondary mt-2">{question.explanation}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

