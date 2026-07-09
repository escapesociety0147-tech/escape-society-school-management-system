'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileCheck,
  MessageSquare,
  Calendar,
  Users,
  Bell,
  ChevronLeft,
  ChevronRight,
  Home,
  Settings,
  UserCircle,
  LogOut,
  GraduationCap,
} from 'lucide-react'
import { useLocalStorageState } from '@/lib/useLocalStorage'

const mainNavItems = [
  { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
  { name: 'Classes', href: '/teacher/classes', icon: BookOpen },
  { name: 'Students', href: '/teacher/students', icon: Users },
  { name: 'Attendance', href: '/teacher/attendance', icon: CalendarCheck },
  { name: 'Gradebook', href: '/teacher/gradebook', icon: ClipboardList },
  { name: 'Assignments', href: '/teacher/assignments', icon: FileCheck },
  { name: 'Events', href: '/teacher/events', icon: Calendar },
  { name: 'Messages', href: '/teacher/messages', icon: MessageSquare },
  { name: 'Notifications', href: '/teacher/notifications', icon: Bell },
]

const accountNavItems = [
  { name: 'Profile', href: '/teacher/profile', icon: UserCircle },
  { name: 'Settings', href: '/teacher/settings', icon: Settings },
]

export default function TeacherSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [profile] = useLocalStorageState('esm_teacher_profile', {
    name: '',
    role: '',
    email: '',
    phone: '',
  })

  const handleLogout = () => {
    const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'
    document.cookie = `auth_token=; ${expired}`
    document.cookie = `user_type=; ${expired}`
    document.cookie = `user_data=; ${expired}`
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_type')
    router.push('/auth/login')
  }

  return (
    <aside
      className={`
        ${collapsed ? 'w-20' : 'w-64'}
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        h-screen sticky top-0 flex flex-col
      `}
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Link href="/" className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-2 rounded-lg">
            <Home className="h-6 w-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Teacher Portal
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Class workspace
              </p>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {!collapsed && (
          <div className="px-4 mb-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Teaching
            </h3>
          </div>
        )}
        <ul className="space-y-1 px-3">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all
                    ${isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium text-sm truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {!collapsed && (
          <div className="px-4 mt-6 mb-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Account
            </h3>
          </div>
        )}
        <ul className="space-y-1 px-3">
          {accountNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all
                    ${isActive
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium text-sm truncate">{item.name}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="h-10 w-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {profile.name || 'Teacher Account'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {profile.role || 'Teacher'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-error-500 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 transform -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1.5 shadow-lg hover:shadow-xl transition-shadow"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        )}
      </button>
    </aside>
  )
}
