'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from '@/components/dashboard/layout/ThemeProvider'
import {
  Bell,
  Search,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronDown,
  Menu,
} from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'
import type { NotificationItem } from '@/lib/notifications'

export default function TeacherNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [glowActive, setGlowActive] = useState(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const [profile] = useLocalStorageState('esm_teacher_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
  })
  const [notifications] = useLocalStorageState<NotificationItem[]>('esm_notifications', [])
  const unreadCount = notifications.filter((item) => item.status !== 'Read').length

  const pageTitles: Record<string, string> = {
    '/teacher/dashboard': 'Teacher Dashboard',
    '/teacher/classes': 'My Classes',
    '/teacher/students': 'Students',
    '/teacher/attendance': 'Attendance',
    '/teacher/gradebook': 'Gradebook',
    '/teacher/assignments': 'Assignments',
    '/teacher/events': 'Events',
    '/teacher/messages': 'Messages',
    '/teacher/notifications': 'Notifications',
    '/teacher/profile': 'Profile',
    '/teacher/settings': 'Settings',
  }

  const pageTitle = pageTitles[pathname] || 'Teacher Dashboard'

  useEffect(() => {
    let isMounted = true
    let glowTimeout: NodeJS.Timeout | null = null
    let nextGlowTimeout: NodeJS.Timeout | null = null

    const startGlowAnimation = () => {
      if (!isMounted) return

      setGlowActive(true)

      glowTimeout = setTimeout(() => {
        if (isMounted) {
          setGlowActive(false)
        }
      }, 3000)

      nextGlowTimeout = setTimeout(() => {
        if (isMounted) {
          startGlowAnimation()
        }
      }, 30000)
    }

    const initialTimeout = setTimeout(() => {
      if (isMounted) {
        startGlowAnimation()
      }
    }, 1000)

    return () => {
      isMounted = false
      clearTimeout(initialTimeout)
      if (glowTimeout) clearTimeout(glowTimeout)
      if (nextGlowTimeout) clearTimeout(nextGlowTimeout)
      if (animationRef.current) {
        clearTimeout(animationRef.current)
      }
    }
  }, [])

  const handleLogout = () => {
    const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'
    document.cookie = `auth_token=; ${expired}`
    document.cookie = `user_type=; ${expired}`
    document.cookie = `user_data=; ${expired}`
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_type')
    setUserMenuOpen(false)
    router.push('/auth/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 z-0 pointer-events-none ${
          glowActive ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-500`}
      >
        <div
          className={`absolute bottom-0 h-full w-64 bg-gradient-to-r from-transparent via-primary-400 to-transparent ${
            glowActive ? 'animate-glow-sweep-bottom' : ''
          }`}
          style={{
            filter: 'blur(8px)',
            boxShadow: `
              0 0 40px 20px rgba(20, 184, 166, 0.6),
              0 0 80px 40px rgba(20, 184, 166, 0.4),
              0 0 120px 60px rgba(20, 184, 166, 0.2)
            `,
          }}
        />
      </div>

      <div className="relative z-10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search classes or students..."
                className="pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none w-64"
              />
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative transition-colors"
              onClick={() => router.push('/teacher/notifications')}
            >
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] font-semibold bg-error-500 text-white h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="User menu"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${
                      userMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[80]"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-[90]">
                    <div className="px-4 py-3 flex items-center space-x-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {profile.name || 'Teacher Account'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {profile.email || 'No email set'}
                        </p>
                      </div>
                    </div>
                    <div className="py-1">
                      <a
                        href="/teacher/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        Profile
                      </a>
                      <a
                        href="/teacher/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <svg className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </a>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes glowSweepBottom {
          0% {
            left: -256px;
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            left: calc(100% + 256px);
            opacity: 0;
          }
        }

        .animate-glow-sweep-bottom {
          animation: glowSweepBottom 3s linear forwards;
        }
      `}</style>
    </header>
  )
}
