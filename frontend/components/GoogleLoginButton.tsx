'use client'

import { useGoogleLogin } from '@react-oauth/google'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { authAPI } from '@/lib/api'

interface GoogleLoginButtonProps {
  onError?: (error: string) => void
}

export default function GoogleLoginButton({ onError }: GoogleLoginButtonProps) {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(false)

  // Check if Google Client ID is configured
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
    setEnabled(clientId !== '' && clientId !== 'placeholder-client-id-for-provider')
  }, [])

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!enabled) {
        if (onError) onError('Google sign-in is not configured')
        return
      }
      setLoading(true)
      try {
        const response = await authAPI.googleSignIn(tokenResponse.access_token)
        // Store token first so getCurrentUser can use it
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.access_token)
        }
        const userResponse = await authAPI.getCurrentUser()
        setAuth(userResponse, response.access_token)
        router.push('/dashboard')
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || 'Google sign-in failed'
        if (onError) onError(errorMsg)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
      } finally {
        setLoading(false)
      }
    },
    onError: () => {
      if (onError) onError('Google sign-in failed')
    },
  })

  if (!enabled) {
    return null
  }

  return (
    <button
      onClick={() => googleLogin()}
      disabled={loading}
      className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-text font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
    </button>
  )
}

