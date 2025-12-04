'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { useState, useRef, useEffect } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isActive = (path: string) => pathname === path

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-accent border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center px-6 text-text font-bold text-xl">
                Study Planner
              </Link>
              <div className="flex items-center space-x-2 ml-6">
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-white text-text'
                      : 'text-text-secondary hover:bg-white/50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/tasks"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/tasks')
                      ? 'bg-white text-text'
                      : 'text-text-secondary hover:bg-white/50'
                  }`}
                >
                  Tasks
                </Link>
                <Link
                  href="/pomodoro"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/pomodoro')
                      ? 'bg-white text-text'
                      : 'text-text-secondary hover:bg-white/50'
                  }`}
                >
                  Pomodoro
                </Link>
                <Link
                  href="/notes"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/notes')
                      ? 'bg-white text-text'
                      : 'text-text-secondary hover:bg-white/50'
                  }`}
                >
                  Notes
                </Link>
                <Link
                  href="/classes"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/classes')
                      ? 'bg-white text-text'
                      : 'text-text-secondary hover:bg-white/50'
                  }`}
                >
                  Classes
                </Link>
                <Link
                  href="/quizzes"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/quizzes')
                      ? 'bg-white text-text'
                      : 'text-text-secondary hover:bg-white/50'
                  }`}
                >
                  Quizzes
                </Link>
                <Link
                  href="/schedule"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/schedule')
                      ? 'bg-white text-text'
                      : 'text-text-secondary hover:bg-white/50'
                  }`}
                >
                  Schedule
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4 relative" ref={menuRef}>
              {user && (
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-text-secondary hover:bg-white/50 transition-colors"
                >
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-text font-semibold">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block">{user.name || user.email}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <Link
                    href="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      isActive('/settings')
                        ? 'bg-accent text-text font-medium'
                        : 'text-text-secondary hover:bg-gray-50'
                    }`}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-gray-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}

